# pylint: skip-file
# skip this file from pylint because of "Exception on node <Compare l.43 at 0x7f32ef671810>"
# pylint bug: https://github.com/pylint-dev/pylint/issues/7680
import asyncio
import os
import pickle
import typing as t
from dataclasses import dataclass
from datetime import date, datetime, timedelta

import sqlalchemy as sa
from jinja2 import Environment, FileSystemLoader

import wb.models as m
from shared_utils.dateutils import day_start, format_date
from wb.celery_app import celery_app
from wb.config import CONFIG
from wb.db import multithreading_safe_async_session
from wb.utils.db import resolve_db_ids
from wb.utils.notifications import send_notification_to_people_project

__all__ = ('task_monthly_team_changes_report',)


@dataclass
class ChangeRecordRaw:
    employee_id: int
    source_team_id: int | None
    dest_team_id: int | None
    time: datetime


@dataclass
class ChangeRecordResolved:
    employee: m.Employee
    source_team: m.Team | None
    dest_team: m.Team | None
    time: datetime


async def _send_team_changes_report(start: date, end: date) -> None:
    async with multithreading_safe_async_session() as session:
        results: t.List[ChangeRecordRaw] = []
        employees_team_changes = await session.scalars(
            sa.select(m.AuditEntry).where(
                m.AuditEntry.class_name == m.Employee.__name__,
                m.AuditEntry.fields.any('team_id'),
                m.AuditEntry.time >= day_start(start),
                m.AuditEntry.time < day_start(end + timedelta(days=1)),
            )
        )
        for rec in employees_team_changes.all():
            if not (changes := pickle.loads(rec.data).get('team_id')):  # nosec pickle
                continue
            added = changes.get('added')
            deleted = changes.get('deleted')
            results.append(
                ChangeRecordRaw(
                    employee_id=rec.object_id,
                    source_team_id=deleted[0] if deleted else None,
                    dest_team_id=added[0] if added else None,
                    time=rec.time,
                )
            )
        results = sorted(results, key=lambda r: r.time)
        employees: t.Dict[int, m.Employee] = {
            emp.id: emp
            for emp in await resolve_db_ids(
                m.Employee, {rec.employee_id for rec in results}, session=session
            )
        }
        teams: t.Dict[int, m.Team] = {
            team.id: team
            for team in await resolve_db_ids(
                m.Team,
                {rec.dest_team_id for rec in results if rec.dest_team_id}.union(
                    {rec.source_team_id for rec in results if rec.source_team_id}
                ),
                session=session,
            )
        }
        jinja_env = Environment(
            loader=FileSystemLoader(os.path.dirname(__file__)), autoescape=True
        )
        jinja_template = jinja_env.get_template('teamChangeReport.html.jinja2')
        msg = jinja_template.render(
            recs=[
                ChangeRecordResolved(
                    employee=employees[rec.employee_id],
                    source_team=(
                        teams[rec.source_team_id] if rec.source_team_id else None
                    ),
                    dest_team=teams[rec.dest_team_id] if rec.dest_team_id else None,
                    time=rec.time,
                )
                for rec in results
                if rec.source_team_id or rec.dest_team_id
            ],
            public_base_url=CONFIG.PUBLIC_BASE_URL,
        )
        await send_notification_to_people_project(
            f'Team changing report from {format_date(start)} to {format_date(end)}', msg
        )


@celery_app.task(name='monthly_team_changes_report')
def task_monthly_team_changes_report() -> None:
    print('start monthly team changing report')
    first_day_this_month = date.today().replace(day=1)
    end = first_day_this_month - timedelta(days=1)
    start = end.replace(day=1)
    asyncio.run(_send_team_changes_report(start, end))
    print('end monthly team changes report')
