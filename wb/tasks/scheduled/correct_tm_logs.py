import asyncio
import warnings
from datetime import date, datetime, timedelta
from typing import Any, List, Sequence, Tuple

import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from shared_utils.dateutils import day_start
from wb.celery_app import celery_app
from wb.db import multithreading_safe_async_session

__all__ = ('task_correct_yesterday_tm_log',)


WORK_TIME_DELTA = timedelta(minutes=15)


def activity_boundary(act: m.Activity, day: date) -> Tuple[datetime, datetime]:
    if act.duration != 0:
        return act.time, act.time + timedelta(seconds=act.duration)
    left = act.time - WORK_TIME_DELTA
    right = act.time + WORK_TIME_DELTA
    left = left if left >= day_start(day) else day_start(day)
    right = (
        right
        if right < day_start(day + timedelta(days=1))
        else day_start(day + timedelta(days=1)) - timedelta(seconds=1)
    )
    return left, right


def calc_activities_interval(
    activities: Sequence[m.Activity], day: date
) -> List[Tuple[datetime, datetime]]:
    results: List[Tuple[datetime, datetime]] = []
    if not activities:
        return results
    boundaries = [activity_boundary(act, day) for act in activities]
    boundaries = sorted(boundaries, key=lambda x: x[0])
    curr_start_dt, curr_end_dt = boundaries[0]
    for seg in boundaries:
        if seg[0] <= curr_end_dt:
            curr_end_dt = seg[1]
        else:
            results.append((curr_start_dt, curr_end_dt))
            curr_start_dt = seg[0]
            curr_end_dt = seg[1]
    results.append((curr_start_dt, curr_end_dt))
    return results


async def insert_log(
    employee_id: int,
    status: m.TMRecordType,
    time: datetime,
    session: AsyncSession,
) -> None:
    try:
        obj = m.TMRecord(
            employee_id=employee_id,
            status=status,
            time=time,
            source='activity',
        )
        async with session.begin_nested():
            session.add(obj)
            with warnings.catch_warnings():
                warnings.simplefilter('ignore')
                await session.commit()
    except IntegrityError:
        pass


async def correct_employee_tm_logs(
    employee: m.Employee,
    day: date,
    activity_filter: Any,
    session: AsyncSession,
) -> None:
    # pylint: disable=too-many-locals, too-many-branches, too-many-statements
    next_day = day + timedelta(days=1)
    tm_logs_raw = await session.scalars(
        sa.select(m.TMRecord)
        .where(
            m.TMRecord.employee_id == employee.id,
            m.TMRecord.time >= day_start(day),
            m.TMRecord.time < day_start(next_day),
        )
        .order_by(m.TMRecord.time)
    )
    tm_logs: list[m.TMRecord] = list(tm_logs_raw.all())
    curr_wb_state = m.TMRecordType.LEAVE
    activities_raw = await session.scalars(
        sa.select(m.Activity).where(
            m.Activity.employee_id == employee.id,
            m.Activity.time >= day_start(day),
            m.Activity.time < day_start(next_day),
            activity_filter,
        )
    )
    activities: List[m.Activity] = list(activities_raw.all())
    next_wb_act = 0
    len_wb_act = len(tm_logs)
    intervals = calc_activities_interval(activities, day)
    for interval in intervals:
        time_delta = timedelta(seconds=0)
        while next_wb_act < len_wb_act:
            if tm_logs[next_wb_act].time > interval[0]:
                break
            if tm_logs[next_wb_act].time == interval[0]:
                time_delta = timedelta(seconds=1)
            curr_wb_state = tm_logs[next_wb_act].status
            next_wb_act += 1
        new_opened_state = None
        if curr_wb_state == m.TMRecordType.LEAVE:
            await insert_log(
                employee_id=employee.id,
                status=m.TMRecordType.COME,
                time=interval[0] + time_delta,
                session=session,
            )
            new_opened_state = curr_wb_state = m.TMRecordType.COME
        elif curr_wb_state == m.TMRecordType.AWAY:
            await insert_log(
                employee_id=employee.id,
                status=m.TMRecordType.AWAKE,
                time=interval[0] + time_delta,
                session=session,
            )
            new_opened_state = curr_wb_state = m.TMRecordType.AWAKE
        while next_wb_act < len_wb_act:
            if tm_logs[next_wb_act].time > interval[1]:
                break
            curr_wb_state = tm_logs[next_wb_act].status
            if curr_wb_state == m.TMRecordType.LEAVE:
                if tm_logs[next_wb_act].time != interval[1]:
                    await insert_log(
                        employee_id=employee.id,
                        status=m.TMRecordType.COME,
                        time=tm_logs[next_wb_act].time + timedelta(seconds=1),
                        session=session,
                    )
                    new_opened_state = curr_wb_state = m.TMRecordType.COME
                else:
                    new_opened_state = None
            elif curr_wb_state == m.TMRecordType.AWAY:
                if tm_logs[next_wb_act].time != interval[1]:
                    await insert_log(
                        employee_id=employee.id,
                        status=m.TMRecordType.AWAKE,
                        time=tm_logs[next_wb_act].time + timedelta(seconds=1),
                        session=session,
                    )
                    new_opened_state = curr_wb_state = m.TMRecordType.AWAKE
                else:
                    new_opened_state = None
            elif curr_wb_state == m.TMRecordType.COME:
                new_opened_state = None
                await insert_log(
                    employee_id=employee.id,
                    status=m.TMRecordType.LEAVE,
                    time=tm_logs[next_wb_act].time - timedelta(seconds=1),
                    session=session,
                )
            elif curr_wb_state == m.TMRecordType.AWAKE:
                new_opened_state = None
                await insert_log(
                    employee_id=employee.id,
                    status=m.TMRecordType.AWAY,
                    time=tm_logs[next_wb_act].time - timedelta(seconds=1),
                    session=session,
                )
            next_wb_act += 1
        if not new_opened_state:
            continue
        if new_opened_state == m.TMRecordType.COME:
            await insert_log(
                employee_id=employee.id,
                status=m.TMRecordType.LEAVE,
                time=interval[1],
                session=session,
            )
            curr_wb_state = m.TMRecordType.LEAVE
        elif new_opened_state == m.TMRecordType.AWAKE:
            await insert_log(
                employee_id=employee.id,
                status=m.TMRecordType.AWAY,
                time=interval[1],
                session=session,
            )
            curr_wb_state = 'away'
    if next_wb_act == len_wb_act and curr_wb_state == 'away':
        await insert_log(
            employee_id=employee.id,
            status=m.TMRecordType.LEAVE,
            time=intervals[-1][1] + timedelta(seconds=1),
            session=session,
        )


async def correct_tm_logs(day: date) -> None:
    async with multithreading_safe_async_session() as session:
        employees_raw = await session.scalars(sa.select(m.Employee))
        employees: Sequence[m.Employee] = employees_raw.all()
        excluded_sources = await session.scalars(
            sa.select(m.ActivitySource).where(
                sa.or_(
                    m.ActivitySource.type == m.ActivitySourceType.PARARAM,
                    m.ActivitySource.type == m.ActivitySourceType.DISCORD,
                )
            )
        )
        flt = m.Activity.source_id.notin_([s.id for s in excluded_sources.all()])
        for emp in employees:
            await correct_employee_tm_logs(
                emp,
                day,
                activity_filter=flt,
                session=session,
            )


@celery_app.task(name='correct_yesterday_tm_log')
def task_correct_yesterday_tm_log() -> None:
    today = date.today()
    print(f'start correcting tm log for {today}')
    asyncio.run(correct_tm_logs(today - timedelta(days=1)))
    print(f'end correcting tm log for {today}')
