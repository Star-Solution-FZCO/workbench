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
from wb.services.tm import PresenceItem, calc_presence

from ._base import (
    FULL_EMPLOYEE_FIELDS,
    BaseReportItem,
    DaysSimpleReport,
    DaysSimpleReportDayItem,
    DaysSimpleReportItem,
)

__all__ = ('generate_presence_report',)


def _is_weekend(day_type: m.DayType) -> bool:
    return not day_type.is_working_day()


class ReportItem(BaseReportItem):
    come: str = Field(title='Come')
    leave: str = Field(title='Leave')
    total: str = Field(title='Total')
    awake: str = Field(title='with TM')
    away: str = Field(title='without TM')
    missed: int = Field(title='Missed days')
    sick_days: int = Field(title='Sick days')
    vacations: int = Field(title='Vacation days')
    working_days: int = Field(title='Working days')

    @classmethod
    def from_presence_item(
        cls,
        obj: PresenceItem,
        day_type: m.DayType,
        has_activity: bool,
    ) -> 'ReportItem':
        return cls(
            come=obj.come,
            leave=obj.leave,
            total=format_timedelta(obj.total),
            awake=format_timedelta(obj.awake),
            away=format_timedelta(obj.away),
            missed=1 if not _is_weekend(day_type) and not has_activity else 0,
            sick_days=1 if day_type == m.DayType.SICK_DAY else 0,
            vacations=1 if day_type == m.DayType.VACATION else 0,
            working_days=1 if day_type.is_working_day() else 0,
        )


async def generate_presence_report(
    flt: Any,
    start: date,
    end: date,
    session: AsyncSession,
) -> DaysSimpleReport[ReportItem]:
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
    results: list[DaysSimpleReportItem[ReportItem]] = []
    for emp, user_presence in zip(employees, presence):
        emp_out_cls = get_employee_output_model_class(emp, fields=FULL_EMPLOYEE_FIELDS)
        results.append(
            DaysSimpleReportItem(
                employee=emp_out_cls.from_obj(emp),
                days={
                    day: DaysSimpleReportDayItem(
                        item=ReportItem.from_presence_item(
                            data,
                            day_type=days_status[emp.id][day],
                            has_activity=days_activity_status[emp.id][day],
                        ),
                        day_status=days_status[emp.id][day],
                        has_activity=days_activity_status[emp.id][day],
                    )
                    for day, data in user_presence.items()
                },
                total=ReportItem(
                    come='',
                    leave='',
                    total=format_timedelta(
                        sum_timedelta([data.total for data in user_presence.values()])
                    ),
                    awake=format_timedelta(
                        sum_timedelta([data.awake for data in user_presence.values()])
                    ),
                    away=format_timedelta(
                        sum_timedelta([data.away for data in user_presence.values()])
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
                    sick_days=len(
                        list(
                            filter(
                                lambda d: d == m.DayType.SICK_DAY,
                                days_status[emp.id].values(),
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
                    working_days=len(
                        list(
                            filter(
                                lambda d: d.is_working_day(),
                                days_status[emp.id].values(),
                            )
                        ),
                    ),
                ),
            )
        )
    return DaysSimpleReport(
        items=results,
        item_type=ReportItem,
    )
