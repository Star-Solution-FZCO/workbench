from datetime import date
from typing import Any, Dict, List, Sequence

import sqlalchemy as sa
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

import timetracking.models as tmm
import wb.models as m
from shared_utils.dateutils import format_timedelta, sum_timedelta
from wb.schemas import ShortEmployeeOut
from wb.services import get_employees_days_activity_status
from wb.services.schedule import get_employees_days_status
from wb.services.tm import calc_presence

from ._base import BaseReportItem, SimpleReport, SimpleReportItem

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
    tm_session: AsyncSession,
) -> SimpleReport[ReportItem]:
    # pylint: disable=too-many-locals
    employees_raw = await session.scalars(
        sa.select(m.Employee).filter(flt).order_by(m.Employee.english_name)
    )
    employees: Sequence[m.Employee] = employees_raw.all()
    employees_by_email: Dict[str, m.Employee] = {emp.email: emp for emp in employees}
    tm_users_raw = await tm_session.scalars(
        sa.select(tmm.User).filter(tmm.User.email.in_([emp.email for emp in employees]))
    )
    tm_users: Dict[str, tmm.User] = {u.email: u for u in tm_users_raw.all()}
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
    results: List[SimpleReportItem[ReportItem]] = []
    for user_email, user_presence in zip(tm_users.keys(), presence):
        results.append(
            SimpleReportItem(
                employee=ShortEmployeeOut.from_obj(employees_by_email[user_email]),
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
                                    days_status[
                                        employees_by_email[user_email].id
                                    ].items(),
                                )
                            ]
                        )
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
                    vacations=len(
                        list(
                            filter(
                                lambda d: d == m.DayType.VACATION,
                                days_status[employees_by_email[user_email].id].values(),
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
                    working_days=len(
                        list(
                            filter(
                                lambda d: d.is_working_day(),
                                days_status[employees_by_email[user_email].id].values(),
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
