import asyncio
import typing as t
from datetime import datetime, timedelta

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

import timetracking.models as tmm
import wb.models as m
from timetracking.db import tm_multithreading_safe_async_session
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
    tm_user: tmm.User,
    tm_session: AsyncSession,
) -> None:
    now = datetime.utcnow()
    if tm_user.lastLogin and tm_user.lastLogin + timedelta(hours=3) > now:
        return
    status, status_time = await get_employee_tm_current_status(
        employee, session=tm_session
    )
    if status == m.TMRecordType.LEAVE:
        return
    if status_time and status_time + timedelta(hours=3) > now:
        return
    time_to_set = _max([tm_user.lastLogin, status_time]) + timedelta(seconds=2)
    _, __, ok = await set_employee_tm_current_status(
        employee,
        m.TMRecordType.LEAVE,
        source='auto',
        session=tm_session,
        at=time_to_set,
        silent=True,
    )
    if not ok:
        print(
            f'failed to insert auto leave log for {tm_user.userID} at {time_to_set} '
            f'(current status: {status} at {status_time})'
        )


async def auto_leave() -> None:
    async with multithreading_safe_async_session() as session:
        async with tm_multithreading_safe_async_session() as tm_session:
            employees_raw = await session.scalars(
                sa.select(m.Employee).where(m.Employee.active.is_(True))
            )
            employees_tm_raw = await tm_session.scalars(
                sa.select(tmm.User).where(tmm.User.isHidden != 'Y')
            )
            employees_tm = {emp.email: emp for emp in employees_tm_raw.all()}
            for emp in employees_raw.all():
                if not (tm_emp := employees_tm.get(emp.email)):
                    print(f'not found tm user for {emp.email}')
                    continue
                await process_emp(emp, tm_emp, tm_session=tm_session)


@celery_app.task(name='tm_auto_leave')
def task_tm_auto_leave() -> None:
    print('start tm auto leave')
    asyncio.run(auto_leave())
    print('end tm auto leave')
