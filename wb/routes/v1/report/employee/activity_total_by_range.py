from datetime import date, timedelta
from typing import Any, Dict, List

import sqlalchemy as sa
from pydantic import Field, create_model
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.schemas.employee import get_employee_output_model_class
from wb.services import ActivitySummaryItem, calc_activity_summary
from wb.services.employee import get_employees
from wb.services.schedule import get_employees_days_status

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
    vacations=(int, Field(title='Vacations')),
    sick_days=(int, Field(title='Sick days')),
    working_days=(int, Field(title='Working days')),
)  # type: ignore


def _report_item_from_obj(
    obj: ActivitySummaryItem,
    vacations: int,
    sick_days: int,
    working_days: int,
) -> ReportItem:  # type: ignore
    return ReportItem(  # type: ignore
        **{
            field: str(getattr(obj, field))
            for field in ActivitySummaryItem.__fields_annotation__
        },
        vacations=vacations,
        sick_days=sick_days,
        working_days=working_days,
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
    days_status = await get_employees_days_status(
        employees,
        start,
        end,
        session=session,
    )
    for res in activities_raw.all():
        activities[res.employee_id].append(res)
    results: list[SimpleReportItem] = []
    for emp in employees:
        results.append(
            SimpleReportItem(
                employee=emp,
                item=_report_item_from_obj(
                    calc_activity_summary(activities[emp.id]),
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
