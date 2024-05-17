from typing import Any

from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from wb.schemas.employee import get_employee_output_model_class
from wb.services import calc_employee_vacation_days
from wb.services.employee import get_employees

from ._base import FULL_EMPLOYEE_FIELDS, BaseReportItem, SimpleReport, SimpleReportItem

__all__ = ('generate_free_days_report',)


class ReportItem(BaseReportItem):
    total_vacation_days_year_end: int = Field(
        title='Total vacation days till the end of the year'
    )
    total_vacation_days_current: int = Field(title='Total vacation days for today')
    count_existed_vacations: int = Field(title='Existed vacation days')
    count_correction: int = Field(title='Total vacation correction')
    free_vacation_days_year_end: int = Field(
        title='Free vacation days till the end of the year'
    )
    free_vacation_days_current: int = Field(title='Free vacation days for today')
    count_existed_sick_days: int = Field(title='Existed sick days')


async def generate_free_days_report(
    flt: Any, session: AsyncSession
) -> SimpleReport[ReportItem]:
    _, employees = await get_employees(
        employee_filter=flt,
        session=session,
    )
    results: list[SimpleReportItem] = []
    for emp in employees:
        res = await calc_employee_vacation_days(emp, session=session)
        emp_out_cls = get_employee_output_model_class(emp, fields=FULL_EMPLOYEE_FIELDS)
        results.append(
            SimpleReportItem(
                employee=emp_out_cls.from_obj(emp),
                item=ReportItem(
                    total_vacation_days_year_end=res.total_vacation_year_end,
                    total_vacation_days_current=res.total_vacation_days_current,
                    free_vacation_days_year_end=res.free_vacation_days_year_end,
                    free_vacation_days_current=res.free_vacation_days_current,
                    count_existed_vacations=res.count_existed_vacations,
                    count_correction=res.count_correction,
                    count_existed_sick_days=res.count_existed_sick_days,
                ),
            )
        )
    return SimpleReport(items=results, item_type=ReportItem)
