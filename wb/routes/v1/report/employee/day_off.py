import typing as t
from datetime import date

import sqlalchemy as sa
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.schemas.employee import get_employee_output_model_class
from wb.services.employee import get_employees

from ._base import (
    FULL_EMPLOYEE_FIELDS,
    BaseReportItem,
    ListDetailsReport,
    ListDetailsReportItem,
    ListSummaryReport,
    ListSummaryReportItem,
)

DAY_OFF_DAY_TYPES = (
    m.DayType.VACATION,
    m.DayType.SICK_DAY,
    m.DayType.BUSINESS_TRIP,
    m.DayType.UNPAID_LEAVE,
)


class ReportDetailsItem(BaseReportItem):
    start: str = Field(title='Start')
    end: str = Field(title='End')
    days: int = Field(title='Days')
    type: m.DayType = Field(title='Type')


class ReportSummaryItem(BaseReportItem):
    vacation: int = Field(title='Vacation')
    sick_day: int = Field(title='Sick day')
    business_trip: int = Field(title='Business trip')
    unpaid_leave: int = Field(title='Unpaid leave')


async def generate_day_off_report(
    flt: t.Any,
    start: date,
    end: date,
    session: AsyncSession,
    exclusion_types_filter: t.List[m.DayType] | None = None,
):
    _, employees_raw = await get_employees(
        employee_filter=flt,
        session=session,
    )
    employees: dict[int, m.Employee] = {emp.id: emp for emp in employees_raw}
    employee_ids = list(employees.keys())
    q_guid = (
        sa.select(
            m.EmployeeScheduleExclusion.guid,
        )
        .where(
            m.EmployeeScheduleExclusion.type.in_(DAY_OFF_DAY_TYPES),
            m.EmployeeScheduleExclusion.day >= start,
            m.EmployeeScheduleExclusion.day <= end,
            m.EmployeeScheduleExclusion.canceled.is_(None),
            m.EmployeeScheduleExclusion.employee_id.in_(employee_ids),
        )
        .group_by(m.EmployeeScheduleExclusion.guid)
    )
    if exclusion_types_filter:
        q_guid = q_guid.filter(
            m.EmployeeScheduleExclusion.type.in_(exclusion_types_filter)
        )
    results_guid = await session.scalars(q_guid)
    guids: t.List[str] = list(results_guid.all())
    q = (
        sa.select(
            m.EmployeeScheduleExclusion.guid,
            m.EmployeeScheduleExclusion.type,
            m.EmployeeScheduleExclusion.employee_id,
            sa.func.min(  # pylint: disable=not-callable
                m.EmployeeScheduleExclusion.day
            ).label('start_date'),
            sa.func.max(  # pylint: disable=not-callable
                m.EmployeeScheduleExclusion.day
            ).label('end_date'),
            sa.func.count().label('days'),  # pylint: disable=not-callable
        )
        .where(m.EmployeeScheduleExclusion.guid.in_(guids))
        .group_by(
            m.EmployeeScheduleExclusion.guid,
            m.EmployeeScheduleExclusion.type,
            m.EmployeeScheduleExclusion.employee_id,
        )
    )
    results_raw = await session.execute(q.order_by('start_date'))
    results: t.Dict[int, t.List[ReportDetailsItem]] = {
        emp_id: [] for emp_id in employees.keys()
    }
    for res in results_raw:
        results[res.employee_id].append(
            ReportDetailsItem(
                start=res.start_date.strftime('%d %b %Y'),
                end=res.end_date.strftime('%d %b %Y'),
                days=res.days,
                type=res.type,
            )
        )
    return results, employees


async def generate_day_off_details_report(  # pylint: disable=too-many-locals
    flt: t.Any,
    start: date,
    end: date,
    session: AsyncSession,
    exclusion_types_filter: t.List[m.DayType] | None = None,
) -> ListDetailsReport[ReportDetailsItem]:
    results, employees = await generate_day_off_report(
        flt=flt,
        start=start,
        end=end,
        session=session,
        exclusion_types_filter=exclusion_types_filter,
    )
    items = []
    for emp_id, data in results.items():
        items.append(
            ListDetailsReportItem(
                employee=employees[emp_id],
                items=data,
            )
        )
    return ListDetailsReport(
        items=items,
        item_type=ReportDetailsItem,
    )


async def generate_day_off_summary_report(  # pylint: disable=too-many-locals
    flt: t.Any,
    start: date,
    end: date,
    session: AsyncSession,
    exclusion_types_filter: t.List[m.DayType] | None = None,
) -> ListSummaryReport[ReportSummaryItem]:
    results, employees = await generate_day_off_report(
        flt=flt,
        start=start,
        end=end,
        session=session,
        exclusion_types_filter=exclusion_types_filter,
    )
    total_by_employee = {}
    for emp_id, data in results.items():
        total = {day_type: 0 for day_type in DAY_OFF_DAY_TYPES}
        for item in data:
            total[item.type] += item.days
        total_by_employee[emp_id] = total
    items = []
    for emp_id, _ in results.items():
        items.append(
            ListSummaryReportItem(
                employee=employees[emp_id],
                total=ReportSummaryItem(
                    vacation=total_by_employee[emp_id].get(m.DayType.VACATION, 0),
                    sick_day=total_by_employee[emp_id].get(m.DayType.SICK_DAY, 0),
                    business_trip=total_by_employee[emp_id].get(
                        m.DayType.BUSINESS_TRIP, 0
                    ),
                    unpaid_leave=total_by_employee[emp_id].get(
                        m.DayType.UNPAID_LEAVE, 0
                    ),
                ),
            )
        )
    return ListSummaryReport(
        items=items,
        item_type=ReportSummaryItem,
    )
