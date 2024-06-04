from datetime import date
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.schemas.employee import get_employee_output_model_class
from wb.services import get_employees_days_activity_status
from wb.services.done_tasks import get_done_task_summary_by_day
from wb.services.employee import get_employees
from wb.services.schedule import get_employees_days_status

from .._base import (
    FULL_EMPLOYEE_FIELDS,
    DaysSimpleReport,
    DaysSimpleReportDayItem,
    DaysSimpleReportItem,
)
from .common import ReportItem

__all__ = ('generate_done_tasks_summary_report',)


async def generate_done_tasks_summary_report(
    flt: Any,
    start: date,
    end: date,
    session: AsyncSession,
) -> DaysSimpleReport[ReportItem]:
    _, employees = await get_employees(
        employee_filter=flt,
        session=session,
    )
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
    stats = await get_done_task_summary_by_day(
        employees,
        start,
        end,
        session=session,
    )
    for emp in employees:
        emp_out_cls = get_employee_output_model_class(emp, fields=FULL_EMPLOYEE_FIELDS)
        results.append(
            DaysSimpleReportItem(
                employee=emp_out_cls.from_obj(emp),
                days={
                    day: DaysSimpleReportDayItem(
                        item=ReportItem(
                            issues=day_stats.youtrack_issues,
                            gerrit_commits=day_stats.gerrit_commits,
                            gerrit_comments=day_stats.gerrit_comments,
                            cvs_commits=day_stats.cvs_commits,
                            vacations=1
                            if days_status[emp.id][day] == m.DayType.VACATION
                            else 0,
                            sick_days=1
                            if days_status[emp.id][day] == m.DayType.SICK_DAY
                            else 0,
                            working_days=1
                            if days_status[emp.id][day].is_working_day()
                            else 0,
                            weighted_sum=day_stats.weighted_sum,
                        ),
                        day_status=days_status[emp.id][day],
                        has_activity=days_activity_status[emp.id][day],
                    )
                    for day, day_stats in stats[emp.id].items()
                },
                total=ReportItem(
                    issues=sum(s.youtrack_issues for s in stats[emp.id].values()),
                    gerrit_commits=sum(
                        s.gerrit_commits for s in stats[emp.id].values()
                    ),
                    gerrit_comments=sum(
                        s.gerrit_comments for s in stats[emp.id].values()
                    ),
                    cvs_commits=sum(s.cvs_commits for s in stats[emp.id].values()),
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
                    weighted_sum=sum(s.weighted_sum for s in stats[emp.id].values()),
                ),
            )
        )

    return DaysSimpleReport(
        items=results,
        item_type=ReportItem,
    )
