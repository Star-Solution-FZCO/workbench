import asyncio
from datetime import date, timedelta
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import selectinload

import wb.models as m
from wb.celery_app import celery_app
from wb.config import CONFIG
from wb.db import multithreading_safe_async_session
from wb.services.activity import (
    ActivitySummaryItem,
    calc_activity_summary,
    get_employees_activities,
)
from wb.services.schedule import get_employees_days_status
from wb.tasks.send import task_send_bbot_message

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


__all__ = ('task_weekly_activity_monitor',)

SKIP_WORKING_DAYS_PART = 0.2

RANGE_LENGTH_DAYS_MANAGERS = 14
# fewer than 5 activities by 2 week (10 working days)
TASK_PER_DAY_WARNING_MANAGERS = 5 / 10
RANGE_LENGTH_DAYS_HR = 7
# fewer than 5 activities by 1 week (5 working days)
TASK_PER_DAY_WARNING_HR = 5 / 5


def _count_done_tasks(summary: ActivitySummaryItem) -> int:
    return sum(
        [
            summary.youtrack,
            summary.gerrit_merged,
            summary.gerrit_new,
            summary.cvs,
            summary.zendesk,
        ]
    )


def _is_working_day(day: m.DayType) -> bool:
    return day in (m.DayType.WORKING_DAY, m.DayType.WORKING_DAY_PERSONAL)


def _is_planned_day(day: m.DayType) -> bool:
    return day.is_employed() and day not in (
        m.DayType.WEEKEND,
        m.DayType.HOLIDAY,
    )


def _link_to_summary_report(emp: m.Employee, start: date, end: date) -> str:
    s_str = start.strftime('%Y-%m-%d')
    e_str = end.strftime('%Y-%m-%d')
    return f'{CONFIG.PUBLIC_BASE_URL}/reports/activity-summary?id={emp.id}&start={s_str}&end={e_str}'


def _link_to_daily_report(emp: m.Employee, day: date) -> str:
    return _link_to_summary_report(emp, day, day)


async def check_major_activity(
    employees: list[m.Employee],
    start: date,
    end: date,
    warning: float,
    session: 'AsyncSession',
) -> tuple[set[int], set[int]]:
    activities = await get_employees_activities(employees, start, end, session=session)
    summaries = {emp.id: calc_activity_summary(activities[emp.id]) for emp in employees}
    days = await get_employees_days_status(employees, start, end, session=session)
    results: tuple[set[int], set[int]] = (set(), set())
    for emp in employees:
        working_days = len([d for d in days[emp.id].values() if _is_working_day(d)])
        total_planned = len([d for d in days[emp.id].values() if _is_planned_day(d)])
        if (
            total_planned < 2
            or working_days == 0
            or working_days / total_planned < SKIP_WORKING_DAYS_PART
        ):
            continue
        task_count = _count_done_tasks(summaries[emp.id])
        if task_count == 0:
            results[1].add(emp.id)
            continue
        if task_count / working_days < warning:
            results[0].add(emp.id)
    return results


async def monitor_managers() -> None:
    # pylint: disable=too-many-locals
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=RANGE_LENGTH_DAYS_MANAGERS - 1)
    async with multithreading_safe_async_session() as session:
        employees_raw = await session.scalars(
            sa.select(m.Employee)
            .where(
                m.Employee.active.is_(True),
                m.Employee.disable_activity_monitor.is_(False),
            )
            .options(
                selectinload(m.Employee.managers),
            )
        )
        employees = {emp.id: emp for emp in employees_raw.all()}

        warn_emp, crit_emp = await check_major_activity(
            list(employees.values()), start, end, TASK_PER_DAY_WARNING_MANAGERS, session
        )
        notifications: dict[int, tuple[set[int], set[int]]] = {}
        recipients: dict[int, m.Employee] = {}

        def _check_or_create_recipient(emp: m.Employee) -> None:
            if emp.id in notifications:
                return
            notifications[emp.id] = (set(), set())
            recipients[emp.id] = emp

        for emp_id in warn_emp:
            for manager in employees[emp_id].managers:
                _check_or_create_recipient(manager)
                notifications[manager.id][1].add(emp_id)
        for emp_id in crit_emp:
            for manager in employees[emp_id].managers:
                _check_or_create_recipient(manager)
                notifications[manager.id][0].add(emp_id)

        for recipient in recipients.values():
            if not recipient.pararam:
                continue
            text_lines: list[str] = []
            for crit_notify in notifications[recipient.id][0]:
                text_lines.append(
                    f"CRITICAL: {employees[crit_notify].link_pararam} don't have any major activity "
                    f'from {max((start, employees[crit_notify].work_started))} to {end} '
                    f'([details]({_link_to_summary_report(employees[crit_notify], start, end)}))'
                )
            for warn_notify in notifications[recipient.id][1]:
                text_lines.append(
                    f'WARNING: {employees[warn_notify].link_pararam} have fewer than 5 major activity '
                    f'from {max((start, employees[warn_notify].work_started))} to {end} '
                    f'([details]({_link_to_summary_report(employees[warn_notify], start, end)}))'
                )
            task_send_bbot_message.delay(recipient.pararam, '\n'.join(text_lines))


async def monitor_weekly_hr() -> None:
    # pylint: disable=too-many-locals
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=RANGE_LENGTH_DAYS_HR - 1)
    async with multithreading_safe_async_session() as session:
        recipients = await session.scalars(
            sa.select(m.Employee).where(
                m.Employee.active.is_(True),
                m.Employee.roles.any(m.EmployeeRole.role == 'super_hr'),
            )
        )
        employees_raw = await session.scalars(
            sa.select(m.Employee).where(
                m.Employee.active.is_(True),
                m.Employee.disable_activity_monitor.is_(False),
            )
        )
        employees = {emp.id: emp for emp in employees_raw.all()}

        warn_emp, _ = await check_major_activity(
            list(employees.values()), start, end, TASK_PER_DAY_WARNING_HR, session
        )

        text_lines: list[str] = []
        for emp_id in warn_emp:
            text_lines.append(
                f'WARNING: {employees[emp_id].link_pararam} have fewer than 5 major activity '
                f'from {max((start, employees[emp_id].work_started))} to {end} '
                f'([details]({_link_to_summary_report(employees[emp_id], start, end)}))         s'
            )

        for recipient in recipients:
            if not recipient.pararam:
                continue
            task_send_bbot_message.delay(recipient.pararam, '\n'.join(text_lines))


async def monitor_daily_hr() -> None:
    today = date.today()
    if today.weekday() == 0:
        report_date = today - timedelta(days=3)
    else:
        report_date = today - timedelta(days=1)
    async with multithreading_safe_async_session() as session:
        recipients = await session.scalars(
            sa.select(m.Employee).where(
                m.Employee.active.is_(True),
                m.Employee.roles.any(m.EmployeeRole.role == 'super_hr'),
            )
        )
        employees_raw = await session.scalars(
            sa.select(m.Employee).where(
                m.Employee.active.is_(True),
                m.Employee.disable_activity_monitor.is_(False),
            )
        )
        employees = list(employees_raw.all())
        days = await get_employees_days_status(
            employees, report_date, report_date, session=session
        )
        employees = [
            emp for emp in employees if _is_working_day(days[emp.id][report_date])
        ]
        active_employees_raw = await session.scalars(
            sa.select(m.Activity.employee_id).where(
                m.Activity.time >= report_date,
                m.Activity.time < today,
            )
        )
        active_employees = set(active_employees_raw.all())

        text_lines: list[str] = []
        for emp in employees:
            if emp.id not in active_employees:
                text_lines.append(
                    f'CRITICAL: {emp.link_pararam} have no activity '
                    f'on [{report_date}]({_link_to_daily_report(emp, report_date)})'
                )
        if not text_lines:
            return
        for recipient in recipients:
            if not recipient.pararam:
                continue
            task_send_bbot_message.delay(recipient.pararam, '\n'.join(text_lines))


async def monitor_weekly() -> None:
    await monitor_managers()
    await monitor_weekly_hr()


async def monitor_daily() -> None:
    await monitor_daily_hr()


@celery_app.task(name='weekly_activity_monitor')
def task_weekly_activity_monitor() -> None:
    print('start monitoring weekly activity')
    asyncio.run(monitor_weekly())
    print('end monitoring weekly activity')


@celery_app.task(name='daily_activity_monitor')
def task_daily_activity_monitor() -> None:
    print('start monitoring daily activity')
    asyncio.run(monitor_daily())
    print('end monitoring daily activity')
