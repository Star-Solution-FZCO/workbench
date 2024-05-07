import csv
import io
import typing as t
from dataclasses import dataclass
from datetime import date

from pydantic import BaseModel

import wb.models as m
from wb.routes.v1.report.base import BaseReportItem, ReportItemT
from wb.schemas import BaseListOutput, ShortEmployeeOut
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
)


SHORT_EMPLOYEE_LABELS = {
    'english_name': 'English name',
    'pararam': 'Pararam',
}


def _short_employee_to_values(emp: ShortEmployeeOut) -> list[str]:
    return [getattr(emp, field) for field in SHORT_EMPLOYEE_LABELS]


class SimpleReportItem(BaseModel, t.Generic[ReportItemT]):
    employee: ShortEmployeeOut
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
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            list(SHORT_EMPLOYEE_LABELS.keys())
            + [field.label for field in fields_metadata]
        )
        for item in self.items:
            writer.writerow(
                _short_employee_to_values(item.employee)
                + [str(getattr(item.item, field.name)) for field in fields_metadata]
            )
        return output


class DaysSimpleReportDayItem(BaseModel, t.Generic[ReportItemT]):
    day_status: m.DayType
    has_activity: bool
    item: ReportItemT


class DaysSimpleReportItem(BaseModel, t.Generic[ReportItemT]):
    employee: ShortEmployeeOut
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
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            list(SHORT_EMPLOYEE_LABELS.keys())
            + ['date']
            + [field.label for field in fields_metadata]
        )
        for item in self.items:
            for day, data in item.days.items():
                writer.writerow(
                    _short_employee_to_values(item.employee)
                    + [day.strftime('%d %b %Y')]
                    + [str(getattr(data.item, field.name)) for field in fields_metadata]
                )
        return output


class DaysListReportDayItem(BaseModel, t.Generic[ReportItemT]):
    day_status: m.DayType
    items: list[ReportItemT]


class DaysListReportItem(BaseModel, t.Generic[ReportItemT]):
    employee: ShortEmployeeOut
    days: dict[date, DaysListReportDayItem[ReportItemT]]


class ListSummaryReportItem(BaseModel, t.Generic[ReportItemT]):
    employee: ShortEmployeeOut
    total: ReportItemT


class ListDetailsReportItem(BaseModel, t.Generic[ReportItemT]):
    employee: ShortEmployeeOut
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
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            list(SHORT_EMPLOYEE_LABELS.keys())
            + ['date']
            + [field.label for field in fields_metadata]
        )
        for item in self.items:
            for day, data in item.days.items():
                for list_item in data.items:
                    writer.writerow(
                        _short_employee_to_values(item.employee)
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
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            list(SHORT_EMPLOYEE_LABELS.keys())
            + [field.label for field in fields_metadata]
        )
        for item in self.items:
            writer.writerow(
                _short_employee_to_values(item.employee)
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
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            list(SHORT_EMPLOYEE_LABELS.keys())
            + [field.label for field in fields_metadata]
        )
        for item in self.items:
            for data in item.items:
                writer.writerow(
                    _short_employee_to_values(item.employee)
                    + [str(getattr(data, field.name)) for field in fields_metadata]
                )
        return output
