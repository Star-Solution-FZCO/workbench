from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, timedelta
from typing import ClassVar, TypedDict

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from shared_utils.dateutils import date_range
from wb.constants import DONE_TASKS_SCORE_PERIOD

__all__ = (
    'get_done_task_summary',
    'get_done_task_summary_by_day',
    'DoneTaskSummaryItem',
)


class DoneTaskSummaryField(TypedDict):
    source_type: m.ActivitySourceType
    task_type: str
    weight: float


@dataclass
class DoneTaskSummaryItem:
    youtrack_issues: int = 0
    gerrit_commits: int = 0
    gerrit_comments: int = 0
    cvs_commits: int = 0

    __fields_annotation__: ClassVar[dict[str, DoneTaskSummaryField]] = {
        'youtrack_issues': {
            'source_type': m.ActivitySourceType.YOUTRACK,
            'task_type': 'RESOLVED_ISSUE',
            'weight': 1,
        },
        'gerrit_commits': {
            'source_type': m.ActivitySourceType.GERRIT,
            'task_type': 'MERGED_COMMIT',
            'weight': 1,
        },
        'gerrit_comments': {
            'source_type': m.ActivitySourceType.GERRIT,
            'task_type': 'COMMENT',
            'weight': 0,
        },
        'cvs_commits': {
            'source_type': m.ActivitySourceType.CVS,
            'task_type': 'COMMIT',
            'weight': 0.25,
        },
    }

    def add_task(self, task: m.DoneTask) -> None:
        for field, annotation in self.__fields_annotation__.items():
            if (
                task.source.type == annotation['source_type']
                and task.task_type == annotation['task_type']
            ):
                setattr(self, field, getattr(self, field) + 1)

    @property
    def weighted_sum(self) -> float:
        return sum(
            getattr(self, field) * annotation['weight']
            for field, annotation in self.__fields_annotation__.items()
        )


async def get_done_task_summary(
    employees: Sequence[m.Employee],
    start: date,
    end: date,
    session: AsyncSession,
) -> dict[int, DoneTaskSummaryItem]:
    results = {emp.id: DoneTaskSummaryItem() for emp in employees}

    done_tasks_raw = await session.scalars(
        sa.select(m.DoneTask).filter(
            m.DoneTask.employee_id.in_([emp.id for emp in employees]),
            m.DoneTask.time >= start,
            m.DoneTask.time < end + timedelta(days=1),
        )
    )
    for task in done_tasks_raw.all():
        results[task.employee_id].add_task(task)

    return results


async def get_done_task_summary_by_day(
    employees: Sequence[m.Employee],
    start: date,
    end: date,
    session: AsyncSession,
) -> dict[int, dict[date, DoneTaskSummaryItem]]:
    results = {
        emp.id: {day: DoneTaskSummaryItem() for day in date_range(start, end)}
        for emp in employees
    }

    done_tasks_raw = await session.scalars(
        sa.select(m.DoneTask).filter(
            m.DoneTask.employee_id.in_([emp.id for emp in employees]),
            m.DoneTask.time >= start,
            m.DoneTask.time < end + timedelta(days=1),
        )
    )
    for task in done_tasks_raw.all():
        results[task.employee_id][task.time.date()].add_task(task)

    return results
