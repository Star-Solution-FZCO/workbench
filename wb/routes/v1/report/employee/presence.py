from datetime import date
from typing import Any, Sequence

import sqlalchemy as sa
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

import timetracking.models as tmm
import wb.models as m
from shared_utils.dateutils import format_timedelta, sum_timedelta
from wb.schemas import ShortEmployeeOut
from wb.services import get_employees_days_activity_status
from wb.services.schedule import get_employees_days_status
from wb.services.tm import PresenceItem, calc_presence

from ._base import (
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
        )


async def generate_presence_report(
    flt: Any,
    start: date,
    end: date,
    session: AsyncSession,
    tm_session: AsyncSession,
) -> DaysSimpleReport[ReportItem]:
    # pylint: disable=too-many-locals
    employees_raw = await session.scalars(
        sa.select(m.Employee).filter(flt).order_by(m.Employee.english_name)
    )
    employees: Sequence[m.Employee] = employees_raw.all()
    employees_by_email: dict[str, m.Employee] = {emp.email: emp for emp in employees}
    tm_users_raw = await tm_session.scalars(
        sa.select(tmm.User).filter(tmm.User.email.in_([emp.email for emp in employees]))
    )
    tm_users: list[str, tmm.User] = {u.email: u for u in tm_users_raw.all()}
    presence = await calc_presence(
        list(tm_users.values()), start, end, tm_session=tm_session
    )
    days_status = await get_employees_days_status(
        [employees_by_email[user_email] for user_email in tm_users.keys()],
        start,
        end,
        session=session,
    )
    days_activity_status = await get_employees_days_activity_status(
        [employees_by_email[user_email] for user_email in tm_users.keys()],
        start,
        end,
        session=session,
    )
    results: list[DaysSimpleReportItem[ReportItem]] = []
    for user_email, user_presence in zip(tm_users.keys(), presence):
        results.append(
            DaysSimpleReportItem(
                employee=ShortEmployeeOut.from_obj(employees_by_email[user_email]),
                days={
                    day: DaysSimpleReportDayItem(
                        item=ReportItem.from_presence_item(
                            data,
                            day_type=days_status[employees_by_email[user_email].id][
                                day
                            ],
                            has_activity=days_activity_status[
                                employees_by_email[user_email].id
                            ][day],
                        ),
                        day_status=days_status[employees_by_email[user_email].id][day],
                        has_activity=days_activity_status[
                            employees_by_email[user_email].id
                        ][day],
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
                                lambda d: not days_activity_status[
                                    employees_by_email[
                                        user_email  # pylint: disable=cell-var-from-loop
                                    ].id
                                ][d],
                                [
                                    day
                                    for day, _ in filter(
                                        lambda d: not _is_weekend(d[1]),
                                        days_status[
                                            employees_by_email[user_email].id
                                        ].items(),
                                    )
                                ],
                            )
                        )
                    ),
                    sick_days=len(
                        list(
                            filter(
                                lambda d: d == m.DayType.SICK_DAY,
                                days_status[employees_by_email[user_email].id].values(),
                            )
                        )
                    ),
                    vacations=len(
                        list(
                            filter(
                                lambda d: d == m.DayType.VACATION,
                                days_status[employees_by_email[user_email].id].values(),
                            )
                        )
                    ),
                ),
            )
        )
    return DaysSimpleReport(
        items=results,
        item_type=ReportItem,
    )
