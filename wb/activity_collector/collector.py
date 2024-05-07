import asyncio
from datetime import datetime, timedelta, timezone
from typing import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

import wb.models as m
from wb.activity_collector.connectors import create_connector

from .models import EmployeeActivitySourceAlias

LOADING_LAG_MINUTES = 30


__all__ = ('load_all_activities',)


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
    await update_users(session_maker)
    async with session_maker() as session:
        sources_raw = await session.scalars(
            sa.select(m.ActivitySource).where(m.ActivitySource.active.is_(True))
        )
        sources: Sequence[m.ActivitySource] = sources_raw.all()
        now = datetime.utcnow() - timedelta(minutes=LOADING_LAG_MINUTES)
        connectors = [
            create_connector(source)
            for source in sources
            if source.activity_collected < now
        ]
        connectors_aliases = [
            await conn.get_stored_aliases(session=session) for conn in connectors
        ]
    results = await asyncio.gather(
        *[
            conn.get_activities(
                conn.source.activity_collected.replace(tzinfo=timezone.utc).timestamp(),
                now.replace(tzinfo=timezone.utc).timestamp(),
                aliases=aliases,
            )
            for conn, aliases in zip(connectors, connectors_aliases)
        ],
        return_exceptions=True,
    )
    async with session_maker() as session:
        for conn, r in zip(connectors, results):
            if isinstance(r, BaseException):
                print(f'error: {r}')
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
            source.activity_collected = now
            await session.commit()
