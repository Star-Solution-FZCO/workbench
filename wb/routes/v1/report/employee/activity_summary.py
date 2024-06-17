from datetime import date
from typing import Any

from pydantic import Field, create_model
from sqlalchemy.ext.asyncio import AsyncSession

from shared_utils.dataclassutils import sum_dataclasses
from wb.services import ActivitySummaryItem, calc_activity_summary
from wb.services.activity import get_employees_activities_by_day
from wb.services.employee import get_employees
from wb.services.schedule import get_employees_days_status

from ._base import (
    BaseReportItem,
    DaysSimpleReport,
    DaysSimpleReportDayItem,
    DaysSimpleReportItem,
)

__all__ = ('generate_activity_summary_report',)


ReportItem = create_model(
    'ReportItem',
    __base__=BaseReportItem,
    **{
        field: (
            str,
            Field(title=annotation['name']),
        )
        for field, annotation in ActivitySummaryItem.__fields_annotation__.items()
    },
)  # type: ignore


def _report_item_from_obj(obj: ActivitySummaryItem) -> ReportItem:  # type: ignore
    return ReportItem(  # type: ignore
        **{
            field: str(getattr(obj, field))
            for field in ActivitySummaryItem.__fields_annotation__
        }
    )


async def generate_activity_summary_report(
    flt: Any, start: date, end: date, session: AsyncSession
) -> DaysSimpleReport[ReportItem]:  # type: ignore
    _, employees = await get_employees(
        employee_filter=flt,
        session=session,
    )
    results: list[DaysSimpleReportItem] = []
    chunk_size = 20 * 365 // ((end - start).days + 1)
    employees_chunks = [
        employees[i : i + chunk_size] for i in range(0, len(employees), chunk_size)
    ]

    for chunk in employees_chunks:
        activities = await get_employees_activities_by_day(
            chunk, start, end, session=session
        )
        days_status = await get_employees_days_status(
            chunk, start, end, session=session
        )
        for emp in chunk:
            summaries = {
                day: calc_activity_summary(acts)
                for day, acts in activities[emp.id].items()
            }
            results.append(
                DaysSimpleReportItem(
                    employee=emp,
                    days={
                        day: DaysSimpleReportDayItem(
                            item=_report_item_from_obj(summaries[day]),
                            day_status=days_status[emp.id][day],
                            has_activity=len(acts) > 0,
                        )
                        for day, acts in activities[emp.id].items()
                    },
                    total=_report_item_from_obj(
                        sum_dataclasses(ActivitySummaryItem, summaries.values())
                    ),
                )
            )
    return DaysSimpleReport(
        items=results,
        item_type=ReportItem,
    )
