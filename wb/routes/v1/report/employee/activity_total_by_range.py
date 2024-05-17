from datetime import date, timedelta
from typing import Any, Dict, List

import sqlalchemy as sa
from pydantic import Field, create_model
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.schemas.employee import get_employee_output_model_class
from wb.services import ActivitySummaryItem, calc_activity_summary
from wb.services.employee import get_employees

from ._base import FULL_EMPLOYEE_FIELDS, BaseReportItem, SimpleReport, SimpleReportItem

__all__ = ('generate_activity_total_by_range_report',)


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


async def generate_activity_total_by_range_report(
    flt: Any,
    start: date,
    end: date,
    session: AsyncSession,
) -> SimpleReport[ReportItem]:  # type: ignore
    _, employees = await get_employees(
        employee_filter=flt,
        session=session,
    )
    employee_ids = [emp.id for emp in employees]
    flt = sa.and_(
        m.Activity.employee_id.in_(employee_ids),
        m.Activity.time >= start,
        m.Activity.time < end + timedelta(days=1),
    )
    q = sa.select(m.Activity).filter(flt).order_by(m.Activity.time.desc())
    activities_raw = await session.scalars(q)
    activities: Dict[int, List[m.Activity]] = {emp.id: [] for emp in employees}
    for res in activities_raw.all():
        activities[res.employee_id].append(res)
    results: list[SimpleReportItem] = []
    for emp in employees:
        emp_out_cls = get_employee_output_model_class(emp, fields=FULL_EMPLOYEE_FIELDS)
        results.append(
            SimpleReportItem(
                employee=emp_out_cls.from_obj(emp),
                item=_report_item_from_obj(calc_activity_summary(activities[emp.id])),
            )
        )
    return SimpleReport(
        items=results,
        item_type=ReportItem,
    )
