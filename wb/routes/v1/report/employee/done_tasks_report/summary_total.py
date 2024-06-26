from datetime import date
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.services.done_tasks import get_done_task_summary
from wb.services.employee import get_employees
from wb.services.schedule import get_employees_days_status

from .._base import SimpleReport, SimpleReportItem
from .common import ReportItem

__all__ = ('generate_done_tasks_summary_total_report',)


async def generate_done_tasks_summary_total_report(
    flt: Any,
    start: date,
    end: date,
    session: AsyncSession,
) -> SimpleReport[ReportItem]:
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

    results: list[SimpleReportItem[ReportItem]] = []
    stats = await get_done_task_summary(
        employees,
        start,
        end,
        session=session,
    )
    for emp in employees:
        results.append(
            SimpleReportItem(
                employee=emp,
                item=ReportItem(
                    issues=stats[emp.id].youtrack_issues,
                    gerrit_commits=stats[emp.id].gerrit_commits,
                    gerrit_comments=stats[emp.id].gerrit_comments,
                    cvs_commits=stats[emp.id].cvs_commits,
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
                    weighted_sum=stats[emp.id].weighted_sum,
                ),
            )
        )

    return SimpleReport(
        items=results,
        item_type=ReportItem,
    )
