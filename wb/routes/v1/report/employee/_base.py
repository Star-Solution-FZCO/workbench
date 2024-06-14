import csv
import io
import typing as t
from dataclasses import dataclass
from datetime import date

from pydantic import BaseModel

import wb.models as m
from wb.routes.v1.report.base import BaseReportItem, ReportItemT
from wb.schemas import BaseListOutput, get_employee_csv_fields
from wb.schemas.employee import get_employee_output_model_class
from wb.utils.query import make_list_output

__all__ = (
    'BaseReportItem',
    'SimpleReport',
    'SimpleReportItem',
    'DaysSimpleReport',
    'DaysSimpleReportItem',
    'DaysSimpleReportDayItem',
    'DaysListReport',
    'DaysListReportItem',
    'DaysListReportDayItem',
    'ListDetailsReport',
    'ListDetailsReportItem',
    'ListSummaryReport',
    'ListSummaryReportItem',
    'FULL_EMPLOYEE_FIELDS',
)


SHORT_EMPLOYEE_LABELS = {
    'english_name': 'English name',
    'pararam': 'Pararam',
}

FULL_EMPLOYEE_FIELDS = (
    'id',
    'english_name',
    'email',
    'pararam',
    'cooperation_type',
    'organization',
    'position',
    'work_started',
    'work_ended',
    'contract_date',
    'managers',
    'team',
)


class EmployeeItemMixin:
    __employee__: m.Employee

    def __init__(self, **data) -> None:
        emp = data.pop('employee')
        emp_out_cls = get_employee_output_model_class(emp, fields=FULL_EMPLOYEE_FIELDS)
        data['employee'] = emp_out_cls.from_obj(emp)
        super().__init__(**data)
        self.__employee__ = emp


class SimpleReportItem(EmployeeItemMixin, BaseModel, t.Generic[ReportItemT]):
    employee: t.Any
    item: ReportItemT


@dataclass
class SimpleReport(t.Generic[ReportItemT]):
    items: list[SimpleReportItem[ReportItemT]]
    item_type: t.Type[ReportItemT]

    def make_list_output(self) -> BaseListOutput[SimpleReportItem[ReportItemT]]:
        return make_list_output(
            count=len(self.items),
            limit=len(self.items),
            offset=0,
            items=self.items,
            metadata={'fields': self.item_type.get_metadata()},
        )

    def make_csv(self) -> io.StringIO:
        fields_metadata = self.item_type.get_metadata()
        emp_headers, emp_rows = _get_employees_cvs_rows(
            [item.__employee__ for item in self.items]
        )
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(emp_headers + [field.label for field in fields_metadata])
        for item in self.items:
            writer.writerow(
                emp_rows[item.__employee__.id]
                + [str(getattr(item.item, field.name)) for field in fields_metadata]
            )
        return output


class DaysSimpleReportDayItem(BaseModel, t.Generic[ReportItemT]):
    day_status: m.DayType
    has_activity: bool
    item: ReportItemT


class DaysSimpleReportItem(EmployeeItemMixin, BaseModel, t.Generic[ReportItemT]):
    employee: t.Any
    days: dict[date, DaysSimpleReportDayItem[ReportItemT]]
    total: ReportItemT | None


@dataclass
class DaysSimpleReport(t.Generic[ReportItemT]):
    items: list[DaysSimpleReportItem[ReportItemT]]
    item_type: t.Type[ReportItemT]

    def make_list_output(self) -> BaseListOutput[DaysSimpleReportItem[ReportItemT]]:
        return make_list_output(
            count=len(self.items),
            limit=len(self.items),
            offset=0,
            items=self.items,
            metadata={'fields': self.item_type.get_metadata()},
        )

    def make_csv(self) -> io.StringIO:
        fields_metadata = self.item_type.get_metadata()
        emp_headers, emp_rows = _get_employees_cvs_rows(
            [item.__employee__ for item in self.items]
        )
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            emp_headers + ['date'] + [field.label for field in fields_metadata]
        )
        for item in self.items:
            for day, data in item.days.items():
                writer.writerow(
                    emp_rows[item.__employee__.id]
                    + [day.strftime('%d %b %Y')]
                    + [str(getattr(data.item, field.name)) for field in fields_metadata]
                )
        return output


class DaysListReportDayItem(BaseModel, t.Generic[ReportItemT]):
    day_status: m.DayType
    items: list[ReportItemT]


class DaysListReportItem(EmployeeItemMixin, BaseModel, t.Generic[ReportItemT]):
    employee: t.Any
    days: dict[date, DaysListReportDayItem[ReportItemT]]


class ListSummaryReportItem(EmployeeItemMixin, BaseModel, t.Generic[ReportItemT]):
    employee: t.Any
    total: ReportItemT


class ListDetailsReportItem(EmployeeItemMixin, BaseModel, t.Generic[ReportItemT]):
    employee: t.Any
    items: list[ReportItemT]


@dataclass
class DaysListReport(t.Generic[ReportItemT]):
    items: list[DaysListReportItem[ReportItemT]]
    item_type: t.Type[ReportItemT]

    def make_list_output(self) -> BaseListOutput[DaysListReportItem[ReportItemT]]:
        return make_list_output(
            count=len(self.items),
            limit=len(self.items),
            offset=0,
            items=self.items,
            metadata={'fields': self.item_type.get_metadata()},
        )

    def make_csv(self) -> io.StringIO:
        fields_metadata = self.item_type.get_metadata()
        emp_headers, emp_rows = _get_employees_cvs_rows(
            [item.__employee__ for item in self.items]
        )
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            emp_headers + ['date'] + [field.label for field in fields_metadata]
        )
        for item in self.items:
            for day, data in item.days.items():
                for list_item in data.items:
                    writer.writerow(
                        emp_rows[item.__employee__.id]
                        + [day.strftime('%d %b %Y')]
                        + [
                            str(getattr(list_item, field.name))
                            for field in fields_metadata
                        ]
                    )
        return output


@dataclass
class ListSummaryReport(t.Generic[ReportItemT]):
    items: list[ListSummaryReportItem[ReportItemT]]
    item_type: t.Type[ReportItemT]

    def make_list_output(self) -> BaseListOutput[ListSummaryReportItem[ReportItemT]]:
        return make_list_output(
            count=len(self.items),
            limit=len(self.items),
            offset=0,
            items=self.items,
            metadata={'fields': self.item_type.get_metadata()},
        )

    def make_csv(self) -> io.StringIO:
        fields_metadata = self.item_type.get_metadata()
        emp_headers, emp_rows = _get_employees_cvs_rows(
            [item.__employee__ for item in self.items]
        )
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(emp_headers + [field.label for field in fields_metadata])
        for item in self.items:
            writer.writerow(
                emp_rows[item.__employee__.id]
                + [str(getattr(item.total, field.name)) for field in fields_metadata]
            )
        return output


@dataclass
class ListDetailsReport(t.Generic[ReportItemT]):
    items: list[ListDetailsReportItem[ReportItemT]]
    item_type: t.Type[ReportItemT]

    def make_list_output(self) -> BaseListOutput[ListDetailsReportItem[ReportItemT]]:
        return make_list_output(
            count=len(self.items),
            limit=len(self.items),
            offset=0,
            items=self.items,
            metadata={'fields': self.item_type.get_metadata()},
        )

    def make_csv(self) -> io.StringIO:
        fields_metadata = self.item_type.get_metadata()
        emp_headers, emp_rows = _get_employees_cvs_rows(
            [item.__employee__ for item in self.items]
        )
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(emp_headers + [field.label for field in fields_metadata])
        for item in self.items:
            for data in item.items:
                writer.writerow(
                    emp_rows[item.__employee__.id]
                    + [str(getattr(data, field.name)) for field in fields_metadata]
                )
        return output


def _get_employees_cvs_rows(
    employees: t.Sequence[m.Employee],
) -> tuple[list[str], dict[int, list[str]]]:
    fields = {emp.id: get_employee_csv_fields(emp) for emp in employees}
    _seen = set()
    all_fields = list(
        k
        for emp_fields in fields.values()
        for k in emp_fields
        if not (k in _seen or _seen.add(k))  # type: ignore[func-returns-value]
    )
    filtered_fields = [field for field in all_fields if field in FULL_EMPLOYEE_FIELDS]
    return filtered_fields, {
        emp.id: [
            fields[emp.id][field].csv_getter(emp) if field in fields[emp.id] else 'N/A'
            for field in filtered_fields
        ]
        for emp in employees
    }
