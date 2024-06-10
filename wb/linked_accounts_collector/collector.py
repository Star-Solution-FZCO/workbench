from typing import Sequence

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

import wb.models as m
from wb.linked_accounts_collector.connectors import create_connector

__all__ = ('update_accounts',)


async def update_accounts(session_maker: async_sessionmaker[AsyncSession]) -> None:
    async with session_maker() as session:
        sources_raw = await session.scalars(
            sa.select(m.LinkedAccountSource).where(
                m.LinkedAccountSource.active.is_(True)
            )
        )
        sources: Sequence[m.LinkedAccountSource] = sources_raw.all()
        employees_raw = await session.scalars(sa.select(m.Employee))
        employees: Sequence[m.Employee] = employees_raw.all()
        connectors = [create_connector(source) for source in sources]
        for conn in connectors:
            resolved_accounts = await conn.get_accounts(employees)
            for emp_id, account_data in resolved_accounts.items():
                if not account_data:
                    continue
                obj = m.LinkedAccount(
                    employee_id=emp_id,
                    source_id=conn.source.id,
                    account_id=account_data.id,
                    active=account_data.active,
                )
                await session.merge(obj)
        await session.commit()
