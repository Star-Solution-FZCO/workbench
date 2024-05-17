from datetime import date, timedelta
from typing import Any, cast

from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.schemas.employee import get_employee_output_model_class
from wb.services.activity import get_employees_activities_by_day
from wb.services.employee import get_employees
from wb.services.schedule import get_employees_days_status
from wb.utils.current_user import get_current_roles_employee_related

from ._base import (
    FULL_EMPLOYEE_FIELDS,
    BaseReportItem,
    DaysListReport,
    DaysListReportDayItem,
    DaysListReportItem,
)

__all__ = ('generate_activity_details_report',)


def _create_target_link(activity: m.Activity, employee: m.Employee) -> str:
    curr_roles = get_current_roles_employee_related(employee)
    label = (
        f'{activity.target_name} ({activity.target_id})'
        if activity.target_name
        else activity.target_id
    )
    can_view_private = {'self', 'team_lead', 'manager'}.intersection(curr_roles)
    if activity.source.private and not can_view_private:
        label = activity.target_id
    if activity.target_link:
        return f'<a href="{activity.target_link}">{label}</a>'
    return cast(str, label)


class ReportItem(BaseReportItem):
    source: str = Field(title='Source')
    time: str = Field(title='Time')
    duration: str = Field(title='Duration')
    action: str = Field(title='Action')
    target: str = Field(title='target')

    @classmethod
    def from_obj(cls, obj: m.Activity, employee: m.Employee) -> 'ReportItem':
        return cls(
            source=obj.source.name,
            time=str(obj.time.strftime('%d %b %Y %H:%M:%S')),
            duration=str(timedelta(seconds=obj.duration)),
            action=obj.action,
            target=_create_target_link(obj, employee),
        )


async def generate_activity_details_report(
    flt: str | None,
    start: date,
    end: date,
    session: AsyncSession,
    activity_filter: Any = None,
) -> DaysListReport[ReportItem]:
    # pylint: disable=too-many-locals
    _, employees = await get_employees(
        employee_filter=flt,
        session=session,
    )
    activities = await get_employees_activities_by_day(
        employees, start, end, activity_filter=activity_filter, session=session
    )
    results: list[DaysListReportItem] = []
    days_status = await get_employees_days_status(
        employees, start, end, session=session
    )
    for emp in employees:
        emp_out_cls = get_employee_output_model_class(emp, fields=FULL_EMPLOYEE_FIELDS)
        results.append(
            DaysListReportItem(
                employee=emp_out_cls.from_obj(emp),
                days={
                    day: DaysListReportDayItem(
                        day_status=days_status[emp.id][day],
                        items=[ReportItem.from_obj(act, emp) for act in acts],
                    )
                    for day, acts in activities[emp.id].items()
                },
            )
        )
    return DaysListReport(
        items=results,
        item_type=ReportItem,
    )
