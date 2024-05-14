import asyncio
import typing as t
from datetime import datetime, timedelta

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.celery_app import celery_app
from wb.db import multithreading_safe_async_session
from wb.services.tm import (
    get_employee_tm_current_status,
    set_employee_tm_current_status,
)

__all__ = ('task_tm_auto_leave',)


def _max(items: t.Sequence[datetime | None]) -> datetime:
    return max(item for item in items if item)


async def process_emp(
    employee: m.Employee,
    session: AsyncSession,
) -> None:
    now = datetime.utcnow()
    last_logon = None
    if employee.tm:
        last_logon = employee.tm.last_logon
    if last_logon and last_logon + timedelta(hours=3) > now:
        return
    status, status_time = await get_employee_tm_current_status(
        employee, session=session
    )
    if status == m.TMRecordType.LEAVE:
        return
    if status_time and status_time + timedelta(hours=3) > now:
        return
    time_to_set = _max([last_logon, status_time]) + timedelta(seconds=2)
    _, __, ok = await set_employee_tm_current_status(
        employee,
        m.TMRecordType.LEAVE,
        source='auto',
        session=session,
        at=time_to_set,
        silent=True,
    )
    if not ok:
        print(
            f'failed to insert auto leave log for {employee.email} at {time_to_set} '
            f'(current status: {status} at {status_time})'
        )


async def auto_leave() -> None:
    async with multithreading_safe_async_session() as session:
        employees_raw = await session.scalars(
            sa.select(m.Employee).where(m.Employee.active.is_(True))
        )
        for emp in employees_raw.all():
            await process_emp(emp, session=session)


@celery_app.task(name='tm_auto_leave')
def task_tm_auto_leave() -> None:
    print('start tm auto leave')
    asyncio.run(auto_leave())
    print('end tm auto leave')
