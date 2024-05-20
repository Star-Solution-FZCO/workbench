import asyncio
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import TYPE_CHECKING, Any

import sqlalchemy as sa
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.activity_collector.connectors import create_connector
from wb.schemas.employee import get_employee_output_model_class
from wb.services.employee import get_employees
from wb.services.schedule import get_employees_days_status

from ._base import FULL_EMPLOYEE_FIELDS, BaseReportItem, SimpleReport, SimpleReportItem

if TYPE_CHECKING:
    from wb.activity_collector.connectors.base import DoneTask

__all__ = ('generate_done_tasks_report',)


class ReportItem(BaseReportItem):
    issues: int = Field(title='Resolved issues', default=0)
    commits: int = Field(title='Commits merged', default=0)
    comments: int = Field(title='Comments in reviews', default=0)
    vacations: int = Field(title='Vacations', default=0)
    sick_days: int = Field(title='Sick days', default=0)
    working_days: int = Field(title='Working days', default=0)


@dataclass
class GerritStats:
    commits: int = 0
    comments: int = 0


@dataclass
class YTStats:
    issues: int = 0


async def get_stats(
    employees: Sequence[m.Employee],
    start: datetime,
    end: datetime,
    session: AsyncSession,
) -> dict[int, tuple[GerritStats, YTStats]]:
    sources_raw = await session.scalars(
        sa.select(m.ActivitySource).where(
            m.ActivitySource.active.is_(True),
            m.ActivitySource.type.in_(
                [m.ActivitySourceType.GERRIT, m.ActivitySourceType.YOUTRACK]
            ),
        )
    )
    sources: dict[int, m.ActivitySource] = {s.id: s for s in sources_raw.all()}
    connectors = [create_connector(s) for s in sources.values()]
    connectors_aliases = await asyncio.gather(
        *[conn.get_stored_aliases(session=session) for conn in connectors],
        return_exceptions=True,
    )
    all_done_tasks = await asyncio.gather(
        *[
            conn.get_done_tasks(
                start.replace(tzinfo=timezone.utc).timestamp(),
                end.replace(tzinfo=timezone.utc).timestamp(),
                aliases=aliases,
            )
            for conn, aliases in zip(connectors, connectors_aliases)
        ],
        return_exceptions=True,
    )
    results = {emp.id: (GerritStats(), YTStats()) for emp in employees}
    for conn_done_tasks in all_done_tasks:  # type: dict[int, list[DoneTask]]
        for emp_id, tasks in conn_done_tasks.items():
            if emp_id not in results:
                continue
            for task in tasks:
                if sources[task.source_id].type == m.ActivitySourceType.GERRIT:
                    results[emp_id][0].commits += (
                        1 if task.task_type == 'MERGED_COMMIT' else 0
                    )
                    results[emp_id][0].comments += (
                        1 if task.task_type == 'COMMENT' else 0
                    )
                elif sources[task.source_id].type == m.ActivitySourceType.YOUTRACK:
                    results[emp_id][1].issues += (
                        1 if task.task_type == 'RESOLVED_ISSUE' else 0
                    )
    return results


async def generate_done_tasks_report(
    flt: Any,
    start: date,
    end: date,
    session: AsyncSession,
) -> SimpleReport[ReportItem]:
    _, employees = await get_employees(
        employee_filter=flt,
        session=session,
    )
    days_status = await get_employees_days_status(
        employees,
        start,
        end,
        session=session,
    )

    results: list[SimpleReportItem[ReportItem]] = []
    stats = await get_stats(
        employees,
        datetime.combine(start, datetime.min.time()),
        datetime.combine(end + timedelta(days=1), datetime.min.time()),
        session=session,
    )
    for emp in employees:
        emp_out_cls = get_employee_output_model_class(emp, fields=FULL_EMPLOYEE_FIELDS)
        results.append(
            SimpleReportItem(
                employee=emp_out_cls.from_obj(emp),
                item=ReportItem(
                    issues=stats[emp.id][1].issues,
                    commits=stats[emp.id][0].commits,
                    comments=stats[emp.id][0].comments,
                    vacations=len(
                        list(
                            filter(
                                lambda d: d == m.DayType.VACATION,
                                days_status[emp.id].values(),
                            )
                        )
                    ),
                    sick_days=len(
                        list(
                            filter(
                                lambda d: d == m.DayType.SICK_DAY,
                                days_status[emp.id].values(),
                            )
                        )
                    ),
                    working_days=len(
                        list(
                            filter(
                                lambda d: d.is_working_day(),
                                days_status[emp.id].values(),
                            )
                        )
                    ),
                ),
            )
        )

    return SimpleReport(
        items=results,
        item_type=ReportItem,
    )
