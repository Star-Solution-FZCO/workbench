import asyncio
import warnings
from datetime import date, datetime, timedelta
from typing import Any, List, Sequence, Tuple

import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import timetracking.models as tmm
import wb.models as m
from timetracking.db import tm_multithreading_safe_async_session
from timetracking.utils import get_tm_day_start
from wb.celery_app import celery_app
from wb.db import multithreading_safe_async_session

__all__ = ('task_correct_yesterday_tm_log',)


WORK_TIME_DELTA = timedelta(minutes=15)


def activity_boundary(act: m.Activity, day: date) -> Tuple[datetime, datetime]:
    if act.duration != 0:
        return act.time, act.time + timedelta(seconds=act.duration)
    left = act.time - WORK_TIME_DELTA
    right = act.time + WORK_TIME_DELTA
    left = left if left >= get_tm_day_start(day) else get_tm_day_start(day)
    right = (
        right
        if right < get_tm_day_start(day + timedelta(days=1))
        else get_tm_day_start(day + timedelta(days=1)) - timedelta(seconds=1)
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
    wb_user_id: int,
    type: str,  # pylint: disable=redefined-builtin
    time: datetime,
    tm_session: AsyncSession,
) -> None:
    try:
        obj = tmm.Log(
            n=wb_user_id,
            type=type,
            time=time,
            source='act',
        )
        async with tm_session.begin_nested():
            tm_session.add(obj)
            with warnings.catch_warnings():
                warnings.simplefilter('ignore')
                await tm_session.commit()
    except IntegrityError:
        pass


async def correct_employee_tm_logs(
    employee: m.Employee,
    day: date,
    activity_filter: Any,
    session: AsyncSession,
    tm_session: AsyncSession,
) -> None:
    # pylint: disable=too-many-locals, too-many-branches, too-many-statements
    wb_user: tmm.User | None = await tm_session.scalar(
        sa.select(tmm.User).where(tmm.User.email == employee.email)
    )
    if not wb_user:
        return
    next_day = day + timedelta(days=1)
    tm_logs_raw = await tm_session.scalars(
        sa.select(tmm.Log)
        .where(
            tmm.Log.n == wb_user.userID,
            tmm.Log.time >= get_tm_day_start(day),
            tmm.Log.time < get_tm_day_start(next_day),
        )
        .order_by(tmm.Log.time)
    )
    tm_logs: List[tmm.Log] = list(tm_logs_raw.all())
    curr_wb_state = 'go'
    activities_raw = await session.scalars(
        sa.select(m.Activity).where(
            m.Activity.employee_id == employee.id,
            m.Activity.time >= get_tm_day_start(day),
            m.Activity.time < get_tm_day_start(next_day),
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
            curr_wb_state = tm_logs[next_wb_act].type
            next_wb_act += 1
        new_opened_state = None
        if curr_wb_state == 'go':
            await insert_log(
                wb_user_id=wb_user.userID,
                type='come',
                time=interval[0] + time_delta,
                tm_session=tm_session,
            )
            curr_wb_state = 'come'
            new_opened_state = 'come'
        elif curr_wb_state == 'away':
            await insert_log(
                wb_user_id=wb_user.userID,
                type='awake',
                time=interval[0] + time_delta,
                tm_session=tm_session,
            )
            curr_wb_state = 'awake'
            new_opened_state = 'awake'
        while next_wb_act < len_wb_act:
            if tm_logs[next_wb_act].time > interval[1]:
                break
            curr_wb_state = tm_logs[next_wb_act].type
            if curr_wb_state == 'go':
                if tm_logs[next_wb_act].time != interval[1]:
                    await insert_log(
                        wb_user_id=wb_user.userID,
                        type='come',
                        time=tm_logs[next_wb_act].time + timedelta(seconds=1),
                        tm_session=tm_session,
                    )
                    curr_wb_state = 'come'
                    new_opened_state = 'come'
                else:
                    new_opened_state = None
            elif curr_wb_state == 'away':
                if tm_logs[next_wb_act].time != interval[1]:
                    await insert_log(
                        wb_user_id=wb_user.userID,
                        type='awake',
                        time=tm_logs[next_wb_act].time + timedelta(seconds=1),
                        tm_session=tm_session,
                    )
                    curr_wb_state = 'awake'
                    new_opened_state = 'awake'
                else:
                    new_opened_state = None
            elif curr_wb_state == 'come':
                new_opened_state = None
                await insert_log(
                    wb_user_id=wb_user.userID,
                    type='go',
                    time=tm_logs[next_wb_act].time - timedelta(seconds=1),
                    tm_session=tm_session,
                )
            elif curr_wb_state == 'awake':
                new_opened_state = None
                await insert_log(
                    wb_user_id=wb_user.userID,
                    type='away',
                    time=tm_logs[next_wb_act].time - timedelta(seconds=1),
                    tm_session=tm_session,
                )
            next_wb_act += 1
        if not new_opened_state:
            continue
        if new_opened_state == 'come':
            await insert_log(
                wb_user_id=wb_user.userID,
                type='go',
                time=interval[1],
                tm_session=tm_session,
            )
            curr_wb_state = 'go'
        elif new_opened_state == 'awake':
            await insert_log(
                wb_user_id=wb_user.userID,
                type='away',
                time=interval[1],
                tm_session=tm_session,
            )
            curr_wb_state = 'away'
    if next_wb_act == len_wb_act and curr_wb_state == 'away':
        await insert_log(
            wb_user_id=wb_user.userID,
            type='go',
            time=intervals[-1][1] + timedelta(seconds=1),
            tm_session=tm_session,
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
        async with tm_multithreading_safe_async_session() as tm_session:
            for emp in employees:
                await correct_employee_tm_logs(
                    emp,
                    day,
                    activity_filter=flt,
                    session=session,
                    tm_session=tm_session,
                )


@celery_app.task(name='correct_yesterday_tm_log')
def task_correct_yesterday_tm_log() -> None:
    today = date.today()
    print(f'start correcting tm log for {today}')
    asyncio.run(correct_tm_logs(today - timedelta(days=1)))
    print(f'end correcting tm log for {today}')
