import asyncio
import csv
import io
import os
from base64 import b64encode
from datetime import date, timedelta
from typing import Dict, List, Sequence, Set

import sqlalchemy as sa
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import wb.models as m
from shared_utils.dataclassutils import sum_dataclasses
from shared_utils.dateutils import date_range
from wb.celery_app import celery_app
from wb.config import CONFIG
from wb.db import multithreading_safe_async_session
from wb.services import ActivitySummaryItem, calc_activity_summary
from wb.services.schedule import get_employees_days_status
from wb.tasks.send import task_send_email

__all__ = ('task_weekly_activity_reports',)


DAY_LABELS: Dict[m.DayType, str] = {
    m.DayType.WORKING_DAY: 'Work day',
    m.DayType.WEEKEND: 'Weekend',
    m.DayType.WORKING_DAY_PERSONAL: 'Work day (moved)',
    m.DayType.WEEKEND_PERSONAL: 'Weekend (moved)',
    m.DayType.VACATION: 'Vacation',
    m.DayType.UNPAID_LEAVE: 'Unpaid leave',
    m.DayType.SICK_DAY: 'Sick day',
    m.DayType.HOLIDAY: 'Holiday',
    m.DayType.BUSINESS_TRIP: 'Business trip',
    m.DayType.BEFORE_EMPLOYMENT: 'Day before employment',
    m.DayType.AFTER_DISMISSAL: 'Day after dismissal',
}


async def get_activities(
    employees: Sequence[m.Employee], start: date, end: date, session: AsyncSession
) -> Dict[int, Dict[date, List[m.Activity]]]:
    activities_raw = await session.scalars(
        sa.select(m.Activity)
        .filter(
            m.Activity.employee_id.in_([emp.id for emp in employees]),
            m.Activity.time >= start,
            m.Activity.time < end + timedelta(days=1),
        )
        .order_by(m.Activity.time.desc())
    )
    activities: Dict[int, Dict[date, List[m.Activity]]] = {
        emp.id: {day: [] for day in date_range(start=start, end=end)}
        for emp in employees
    }
    for res in activities_raw.all():
        activities[res.employee_id][res.time.date()].append(res)
    return activities


def create_csv(
    employees: Sequence[m.Employee],
    activities: Dict[int, Dict[date, List[m.Activity]]],
    sources: Dict[int, m.ActivitySource],
) -> bytes:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        (
            'user',
            'user_id',
            'pararam_id',
            'work date',
            'time',
            'source',
            'task',
            'action',
            'duration',
        )
    )
    for emp in employees:
        for day, acts in activities[emp.id].items():
            if len(acts) == 0:
                writer.writerow(
                    (
                        f'{emp.english_name}',
                        emp.id,
                        emp.pararam,
                        day.strftime('%Y-%m-%d'),
                        '',
                        '',
                        'no activity',
                        '',
                        '',
                    )
                )
                continue
            for act in acts:
                source = sources.get(act.source_id)
                writer.writerow(
                    (
                        f'{emp.english_name}',
                        emp.id,
                        emp.pararam,
                        day.strftime('%Y-%m-%d'),
                        act.time,
                        source.name if source else '',
                        act.target_id,
                        act.action,
                        act.duration,
                    )
                )
    return output.getvalue().encode()


async def send_reports(start: date, end: date) -> None:
    # pylint: disable=too-many-locals
    jinja_env = Environment(
        loader=FileSystemLoader(os.path.dirname(__file__)), autoescape=True
    )
    jinja_template = jinja_env.get_template('activityReport.html.jinja2')
    async with multithreading_safe_async_session() as session:
        employees_raw = await session.scalars(
            sa.select(m.Employee)
            .where(m.Employee.active.is_(True))
            .options(
                selectinload(m.Employee.managers),
                selectinload(m.Employee.mentors),
                selectinload(m.Employee.watchers),
                selectinload(m.Employee.team).selectinload(m.Team.manager),
            )
        )
        employees: Dict[int, m.Employee] = {emp.id: emp for emp in employees_raw.all()}
        watched: Dict[int, Set[int]] = {emp_id: set() for emp_id in employees.keys()}
        activities = await get_activities(
            list(employees.values()), start, end, session=session
        )
        days_status = await get_employees_days_status(
            list(employees.values()), start, end, session=session
        )
        sources_raw = await session.scalars(sa.select(m.ActivitySource))
        sources = {s.id: s for s in sources_raw.all()}
    for emp in employees.values():
        for w in emp.managers:
            if w.id not in watched:
                continue
            watched[w.id].add(emp.id)
        for w in emp.watchers:
            if w.id not in watched:
                continue
            watched[w.id].add(emp.id)
        if emp.team and emp.team.manager and emp.team.manager.id in watched:
            watched[emp.team.manager.id].add(emp.id)
    for emp in employees.values():
        watched[emp.id].discard(emp.id)
        watched_list = [emp] + [employees[w_id] for w_id in watched[emp.id]]
        data = []
        for w in watched_list:
            days_data = {}
            for day, acts in activities[w.id].items():
                days_data[day] = {
                    'status': DAY_LABELS[days_status[w.id][day]],
                    'summary': calc_activity_summary(acts),
                }
            data.append(
                {
                    'employee': w,
                    'days': days_data,
                    'total': sum_dataclasses(
                        ActivitySummaryItem, [d['summary'] for d in days_data.values()]
                    ),
                }
            )
        html = jinja_template.render(
            data=data,
            public_base_url=CONFIG.PUBLIC_BASE_URL,
        )
        csv_data = create_csv(watched_list, activities, sources)
        task_send_email.delay(
            sender=CONFIG.ACTIVITY_REPORTS_EMAIL,
            recipients=[emp.email],
            subject=f'Activity report from {start.strftime("%d %b %Y")} to {end.strftime("%d %b %Y")}',
            body=html,
            attachments={'activity_report.csv': b64encode(csv_data).decode()},
        )


@celery_app.task(name='weekly_activity_reports')
def task_weekly_activity_reports() -> None:
    print('start sending weekly activity report')
    week_end = date.today() - timedelta(days=1)
    week_start = week_end - timedelta(days=6)
    asyncio.run(send_reports(week_start, week_end))
    print('end sending weekly activity report')
