from datetime import date
from typing import Any

from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from shared_utils.dateutils import format_timedelta, sum_timedelta
from wb.schemas.employee import get_employee_output_model_class
from wb.services import get_employees_days_activity_status
from wb.services.employee import get_employees
from wb.services.schedule import get_employees_days_status
from wb.services.tm import calc_presence

from ._base import FULL_EMPLOYEE_FIELDS, BaseReportItem, SimpleReport, SimpleReportItem

__all__ = ('generate_presence_summary_report',)


class ReportItem(BaseReportItem):
    total: str = Field(title='Total')
    awake: str = Field(title='with TM')
    away: str = Field(title='without TM')
    on_weekend: str = Field(title='On weekend')
    missed: int = Field(title='Missed')
    vacations: int = Field(title='Vacations')
    sick_days: int = Field(title='Sick days')
    working_days: int = Field(title='Working days')


def _is_weekend(day_type: m.DayType) -> bool:
    return not day_type.is_working_day()


async def generate_presence_summary_report(
    flt: Any,
    start: date,
    end: date,
    session: AsyncSession,
) -> SimpleReport[ReportItem]:
    # pylint: disable=too-many-locals
    _, employees = await get_employees(
        employee_filter=flt,
        session=session,
    )
    presence = await calc_presence(employees, start, end, session=session)
    days_status = await get_employees_days_status(
        employees,
        start,
        end,
        session=session,
    )
    days_activity_status = await get_employees_days_activity_status(
        employees,
        start,
        end,
        session=session,
    )
    results: list[SimpleReportItem[ReportItem]] = []
    for emp, user_presence in zip(employees, presence):
        results.append(
            SimpleReportItem(
                employee=emp,
                item=ReportItem(
                    total=format_timedelta(
                        sum_timedelta([data.total for data in user_presence.values()])
                    ),
                    awake=format_timedelta(
                        sum_timedelta([data.awake for data in user_presence.values()])
                    ),
                    away=format_timedelta(
                        sum_timedelta([data.away for data in user_presence.values()])
                    ),
                    on_weekend=format_timedelta(
                        sum_timedelta(
                            [
                                user_presence[day].total
                                for day, _ in filter(
                                    lambda d: _is_weekend(d[1]),
                                    days_status[emp.id].items(),
                                )
                            ]
                        )
                    ),
                    missed=len(
                        list(
                            filter(
                                lambda d: not days_activity_status[emp.id][d],  # pylint: disable=cell-var-from-loop
                                [
                                    day
                                    for day, _ in filter(
                                        lambda d: not _is_weekend(d[1]),
                                        days_status[emp.id].items(),
                                    )
                                ],
                            )
                        )
                    ),
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
