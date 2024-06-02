import asyncio
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING, Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

import wb.models as m
from wb.activity_collector.connectors import create_connector
from wb.log import log

from .models import EmployeeActivitySourceAlias

if TYPE_CHECKING:
    from wb.activity_collector.connectors.base import Connector

LOADING_LAG_MINUTES = 30


__all__ = (
    'load_all_activities',
    'update_done_tasks',
)


async def create_connectors(
    session_maker: async_sessionmaker[AsyncSession],
    updated_before: datetime,
) -> list[tuple['Connector', dict[str, int]]]:
    async with session_maker() as session:
        sources_raw = await session.scalars(
            sa.select(m.ActivitySource).where(m.ActivitySource.active.is_(True))
        )
        sources: Sequence[m.ActivitySource] = sources_raw.all()
        connectors = [
            create_connector(source)
            for source in sources
            if source.activity_collected < updated_before
        ]
        connectors_aliases = [
            await conn.get_stored_aliases(session=session) for conn in connectors
        ]
    return list(zip(connectors, connectors_aliases))


async def update_users(session_maker: async_sessionmaker[AsyncSession]) -> None:
    async with session_maker() as session:
        sources_raw = await session.scalars(
            sa.select(m.ActivitySource).where(m.ActivitySource.active.is_(True))
        )
        sources: Sequence[m.ActivitySource] = sources_raw.all()
        employees_raw = await session.scalars(sa.select(m.Employee))
        employees: Sequence[m.Employee] = employees_raw.all()
        connectors = [create_connector(source) for source in sources]
        for conn in connectors:
            users = await conn.get_users(employees)
            for emp_id, alias in users.items():
                obj = EmployeeActivitySourceAlias(
                    employee_id=emp_id,
                    source_id=conn.source.id,
                    alias=alias,
                )
                await session.merge(obj)
        await session.commit()


async def load_all_activities(session_maker: async_sessionmaker[AsyncSession]) -> None:
    await update_users(session_maker=session_maker)
    shifted_now = datetime.utcnow() - timedelta(minutes=LOADING_LAG_MINUTES)
    connectors = await create_connectors(session_maker, updated_before=shifted_now)
    results = await asyncio.gather(
        *[
            conn.get_activities(
                conn.source.activity_collected.replace(tzinfo=timezone.utc).timestamp(),
                shifted_now.replace(tzinfo=timezone.utc).timestamp(),
                aliases=aliases,
            )
            for conn, aliases in connectors
        ],
        return_exceptions=True,
    )
    async with session_maker() as session:
        for conn_, r in zip(connectors, results):  # type: tuple[Connector, dict[str, int]], list[m.Activity]
            conn, _ = conn_
            if isinstance(r, BaseException):
                log.error(
                    f'[{conn.source.name}({conn.source.id})] load activities error: {r}'
                )
                continue
            source = await session.scalar(
                sa.select(m.ActivitySource).where(m.ActivitySource.id == conn.source.id)
            )
            if not source:
                continue
            for act in r:
                await session.execute(
                    insert(m.Activity)
                    .values(act.to_insert_values())
                    .on_conflict_do_nothing()
                )
            source.activity_collected = shifted_now
            await session.commit()


async def update_done_tasks(session_maker: async_sessionmaker[AsyncSession]) -> None:
    await update_users(session_maker=session_maker)
    shifted_now = datetime.utcnow() - timedelta(minutes=LOADING_LAG_MINUTES)
    connectors = await create_connectors(session_maker, updated_before=shifted_now)
    results = await asyncio.gather(
        *[
            conn.get_updated_done_tasks(
                conn.source.done_tasks_collected.replace(
                    tzinfo=timezone.utc
                ).timestamp(),
                shifted_now.replace(tzinfo=timezone.utc).timestamp(),
                aliases=aliases,
            )
            for conn, aliases in connectors
        ],
        return_exceptions=True,
    )
    async with session_maker() as session:
        for conn_, r in zip(connectors, results):  # type: tuple[Connector, dict[str, int]], list[m.DoneTask]
            conn, _ = conn_
            if isinstance(r, BaseException):
                log.error(
                    f'[{conn.source.name}({conn.source.id})] update done tasks error: {r}'
                )
                continue
            source = await session.scalar(
                sa.select(m.ActivitySource).where(m.ActivitySource.id == conn.source.id)
            )
            if not source:
                continue
            for task in r:
                await session.execute(
                    insert(m.DoneTask)
                    .values(task.to_insert_values())
                    .on_conflict_do_nothing()
                )
            source.done_tasks_collected = shifted_now
            await session.commit()
