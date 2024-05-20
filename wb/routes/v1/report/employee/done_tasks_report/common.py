import asyncio
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import TYPE_CHECKING

import sqlalchemy as sa
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from shared_utils.dateutils import date_range
from wb.activity_collector.connectors import create_connector

from .._base import BaseReportItem

if TYPE_CHECKING:
    from wb.activity_collector.connectors.base import DoneTask

__all__ = (
    'get_stats',
    'ReportItem',
)


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
    start: date,
    end: date,
    session: AsyncSession,
) -> dict[int, dict[date, tuple[GerritStats, YTStats]]]:
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
    start_ts = (
        datetime.combine(start, datetime.min.time())
        .replace(tzinfo=timezone.utc)
        .timestamp()
    )
    end_ts = (
        datetime.combine(end + timedelta(days=1), datetime.min.time())
        .replace(tzinfo=timezone.utc)
        .timestamp()
    )
    all_done_tasks = await asyncio.gather(
        *[
            conn.get_done_tasks(
                start_ts,
                end_ts,
                aliases=aliases,
            )
            for conn, aliases in zip(connectors, connectors_aliases)
        ],
        return_exceptions=True,
    )
    results = {
        emp.id: {day: (GerritStats(), YTStats()) for day in date_range(start, end)}
        for emp in employees
    }
    for conn_done_tasks in all_done_tasks:  # type: dict[int, list[DoneTask]]
        for emp_id, tasks in conn_done_tasks.items():
            if emp_id not in results:
                continue
            for task in tasks:
                if sources[task.source_id].type == m.ActivitySourceType.GERRIT:
                    results[emp_id][task.time.date()][0].commits += (
                        1 if task.task_type == 'MERGED_COMMIT' else 0
                    )
                    results[emp_id][task.time.date()][0].comments += (
                        1 if task.task_type == 'COMMENT' else 0
                    )
                elif sources[task.source_id].type == m.ActivitySourceType.YOUTRACK:
                    results[emp_id][task.time.date()][1].issues += (
                        1 if task.task_type == 'RESOLVED_ISSUE' else 0
                    )
    return results
