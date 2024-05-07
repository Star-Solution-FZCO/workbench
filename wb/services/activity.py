from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import date, timedelta
from enum import Enum
from typing import Any, ClassVar, TypedDict

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from shared_utils.dateutils import date_range
from shared_utils.dict_utils import is_dict_nested_subset

__all__ = (
    'calc_activity_summary',
    'ActivitySummaryItem',
    'get_employees_days_activity_status',
    'get_employees_activities',
    'get_employees_activities_by_day',
)


class ActivitySummaryFieldType(str, Enum):
    COUNT = 'count'
    COUNT_DISTINCT = 'count_distinct'
    DURATION = 'duration'

    @staticmethod
    def __calc_count(acts: Sequence[m.Activity]) -> int:
        return len(acts)

    @staticmethod
    def __calc_duration(acts: Sequence[m.Activity]) -> timedelta:
        return timedelta(seconds=sum(map(lambda a: a.duration, acts)))

    @staticmethod
    def __calc_count_distinct(acts: Sequence[m.Activity]) -> int:
        return len({act.target_id for act in acts})

    def get_calc_function(self) -> Callable[[Sequence[m.Activity]], Any]:
        if self.value == self.__class__.COUNT:
            return self.__calc_count
        if self.value == self.__class__.DURATION:
            return self.__calc_duration
        if self.value == self.__class__.COUNT_DISTINCT:
            return self.__calc_count_distinct
        raise ValueError('wrong field type')


class ActivitySummaryField(TypedDict):
    name: str
    source_type: m.ActivitySourceType
    actions: Sequence[str] | None
    type: ActivitySummaryFieldType
    meta: dict[str, Any] | None


@dataclass
class ActivitySummaryItem:
    youtrack: int
    gerrit_merged: int
    gerrit_new: int
    gerrit_reviewed: int
    gerrit_comments: int
    cvs: int
    google_meet: timedelta
    discord_call: timedelta
    pararam: int
    google_drive: int
    zendesk: int

    __fields_annotation__: ClassVar[dict[str, ActivitySummaryField]] = {
        'youtrack': {
            'name': 'Youtrack',
            'source_type': m.ActivitySourceType.YOUTRACK,
            'actions': None,
            'type': ActivitySummaryFieldType.COUNT_DISTINCT,
            'meta': {'youtrack': {'issue': {'resolved': True}}},
        },
        'gerrit_merged': {
            'name': 'Gerrit merged',
            'source_type': m.ActivitySourceType.GERRIT,
            'actions': ('MERGED',),
            'type': ActivitySummaryFieldType.COUNT,
            'meta': None,
        },
        'gerrit_new': {
            'name': 'Gerrit new changes',
            'source_type': m.ActivitySourceType.GERRIT,
            'actions': ('NEW',),
            'type': ActivitySummaryFieldType.COUNT,
            'meta': None,
        },
        'gerrit_reviewed': {
            'name': 'Gerrit reviewed',
            'source_type': m.ActivitySourceType.GERRIT,
            'actions': ('code review +2',),
            'type': ActivitySummaryFieldType.COUNT,
            'meta': None,
        },
        'gerrit_comments': {
            'name': 'Gerrit comments',
            'source_type': m.ActivitySourceType.GERRIT,
            'actions': ('comment',),
            'type': ActivitySummaryFieldType.COUNT,
            'meta': None,
        },
        'cvs': {
            'name': 'CVS',
            'source_type': m.ActivitySourceType.CVS,
            'actions': None,
            'type': ActivitySummaryFieldType.COUNT,
            'meta': None,
        },
        'google_meet': {
            'name': 'Google meet calls',
            'source_type': m.ActivitySourceType.GOOGLE_MEET,
            'actions': None,
            'type': ActivitySummaryFieldType.DURATION,
            'meta': None,
        },
        'discord_call': {
            'name': 'Discord calls',
            'source_type': m.ActivitySourceType.DISCORD,
            'actions': ('call',),
            'type': ActivitySummaryFieldType.DURATION,
            'meta': None,
        },
        'pararam': {
            'name': 'Pararam posts',
            'source_type': m.ActivitySourceType.PARARAM,
            'actions': ('POST',),
            'type': ActivitySummaryFieldType.COUNT,
            'meta': None,
        },
        'google_drive': {
            'name': 'Google drive',
            'source_type': m.ActivitySourceType.GOOGLE_DRIVE,
            'actions': ('edit',),
            'type': ActivitySummaryFieldType.COUNT,
            'meta': None,
        },
        'zendesk': {
            'name': 'Zendesk',
            'source_type': m.ActivitySourceType.ZENDESK,
            'actions': None,
            'type': ActivitySummaryFieldType.COUNT,
            'meta': None,
        },
    }


def calc_activity_summary(activities: list[m.Activity]) -> ActivitySummaryItem:
    results: dict[str, Any] = {}
    for field, annotation in ActivitySummaryItem.__fields_annotation__.items():
        val = annotation['type'].get_calc_function()(
            [
                act
                for act in activities
                if act.source.type == annotation['source_type']
                and (not annotation['actions'] or act.action in annotation['actions'])
                and (
                    not annotation['meta']
                    or is_dict_nested_subset(annotation['meta'], act.meta)
                )
            ]
        )
        results[field] = val
    return ActivitySummaryItem(**results)


async def get_employees_days_activity_status(
    employees: Sequence[m.Employee], start: date, end: date, session: AsyncSession
) -> dict[int, dict[date, bool]]:
    results = {
        emp.id: {day: False for day in date_range(start, end)} for emp in employees
    }
    results_raw = await session.execute(
        sa.select(
            m.Activity.employee_id,
            sa.func.date(m.Activity.time),
            sa.func.count(),  # pylint: disable=not-callable
        )
        .group_by(
            m.Activity.employee_id,
            sa.func.date(m.Activity.time),
        )
        .where(
            m.Activity.time >= start,
            m.Activity.time < end + timedelta(days=1),
            m.Activity.employee_id.in_([emp.id for emp in employees]),
        )
    )
    for emp_id, day, cnt in results_raw.all():
        results[emp_id][day] = cnt > 0
    return results


async def get_employees_activities(
    employees: Sequence[m.Employee],
    start: date,
    end: date,
    session: AsyncSession,
    activity_filter: Any = None,
) -> dict[int, list[m.Activity]]:
    """
    Retrieve activities of employees within a specified time range.
    Activities for every employee is sorted by asc.

    :param employees: A sequence of Employee objects.
    :type employees: Sequence[m.Employee]
    :param start: The start date of the time range.
    :type start: date
    :param end: The end date of the time range.
    :type end: date
    :param session: The AsyncSession object for database operations.
    :type session: AsyncSession
    :param activity_filter: An optional filter to apply on activities.
    :type activity_filter: Any, defaults to None
    :return: A dictionary mapping employee IDs to lists of activities.
    :rtype: dict[int, list[m.Activity]]
    """
    q = sa.select(m.Activity).filter(
        m.Activity.employee_id.in_([emp.id for emp in employees]),
        m.Activity.time >= start,
        m.Activity.time < end + timedelta(days=1),
    )
    if activity_filter is not None:
        q = q.filter(activity_filter)
    activities_raw = await session.scalars(q.order_by(m.Activity.time))
    activities: dict[int, list[m.Activity]] = {emp.id: [] for emp in employees}
    for res in activities_raw.all():
        activities[res.employee_id].append(res)
    return activities


async def get_employees_activities_by_day(
    employees: Sequence[m.Employee],
    start: date,
    end: date,
    session: AsyncSession,
    activity_filter: Any = None,
) -> dict[int, dict[date, list[m.Activity]]]:
    """
    Retrieve the activities of employees by day within a specified date range.
    Activities for every day is sorted by asc.

    :param employees: A sequence of Employee objects.
    :type employees: Sequence[m.Employee]
    :param start: The start date of the date range.
    :type start: date
    :param end: The end date of the date range.
    :type end: date
    :param session: The AsyncSession object for database operations.
    :type session: AsyncSession
    :param activity_filter: Optional filter for specific activities. Defaults to None.
    :type activity_filter: Any, optional
    :return: A dictionary mapping employee IDs to the dictionary of the employee activities by day.
    :rtype: dict[int, dict[date, list[m.Activity]]]
    """
    results: dict[int, dict[date, list[m.Activity]]] = {
        emp.id: {day: [] for day in date_range(start=start, end=end)}
        for emp in employees
    }
    activities = await get_employees_activities(
        employees, start, end, activity_filter=activity_filter, session=session
    )
    for emp_id, emp_acts in activities.items():
        for act in emp_acts:
            results[emp_id][act.time.date()].append(act)
    return results
