import csv
import io
import typing as t
from dataclasses import dataclass

from pydantic import BaseModel, PrivateAttr

import wb.models as m
from wb.routes.v1.report.base import BaseReportItem, ReportItemT
from wb.schemas import (  # ModelOutPrototype,
    BaseListOutput,
    ReportFieldMetadata,
    ShortTeamOut,
    get_employee_csv_fields,
)
from wb.utils.query import make_list_output

__all__ = (
    'BaseReportItem',
    'SimpleTeamReportItem',
    'SimpleTeamReport',
    'PerMemberTeamReportMemberItem',
    'PerMemberTeamReportItem',
    'PerMemberTeamReport',
    'EMPLOYEE_FIELDS',
)


EMPLOYEE_FIELDS = (
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
)


class SimpleTeamReportItem(BaseModel, t.Generic[ReportItemT]):
    team: ShortTeamOut
    item: ReportItemT


@dataclass
class SimpleTeamReport(t.Generic[ReportItemT]):
    items: list[SimpleTeamReportItem[ReportItemT]]
    item_type: t.Type[ReportItemT]

    def make_list_output(self) -> BaseListOutput[SimpleTeamReportItem[ReportItemT]]:
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
        writer.writerow(['team'] + [field.label for field in fields_metadata])
        for item in self.items:
            writer.writerow(
                [item.team.name]
                + [str(getattr(item.item, field.name)) for field in fields_metadata]
            )
        return output


class PerMemberTeamReportMemberItem(BaseReportItem):
    # employee: ModelOutPrototype
    employee: t.Any

    _employee: m.Employee = PrivateAttr()

    def __init__(self, **kwargs: t.Any) -> None:
        super().__init__(**kwargs)
        self._employee = kwargs['_employee']

    @property
    def raw_employee(self) -> m.Employee:
        return self._employee

    @classmethod
    def get_metadata(cls) -> list[ReportFieldMetadata]:
        return [
            ReportFieldMetadata(
                name=name,
                label=field.title,
                type=field.annotation.__name__,
            )
            for name, field in cls.model_fields.items()
            if name != 'employee'
        ] + [
            ReportFieldMetadata(
                name='employee',
                label='employee',
                type='employee',
            )
        ]


PerMemberTeamReportMemberItemT = t.TypeVar(
    'PerMemberTeamReportMemberItemT', bound=PerMemberTeamReportMemberItem
)


class PerMemberTeamReportItem(BaseModel, t.Generic[PerMemberTeamReportMemberItemT]):
    team: ShortTeamOut
    items: list[PerMemberTeamReportMemberItemT]


@dataclass
class PerMemberTeamReport(t.Generic[PerMemberTeamReportMemberItemT]):
    items: list[PerMemberTeamReportItem[PerMemberTeamReportMemberItemT]]
    item_type: t.Type[PerMemberTeamReportMemberItemT]

    def make_list_output(
        self,
    ) -> BaseListOutput[PerMemberTeamReportItem[PerMemberTeamReportMemberItemT]]:
        return make_list_output(
            count=len(self.items),
            limit=len(self.items),
            offset=0,
            items=self.items,
            metadata={'fields': self.item_type.get_metadata()},
        )

    def make_csv(self) -> io.StringIO:
        fields_metadata = [
            field for field in self.item_type.get_metadata() if field.name != 'employee'
        ]
        employee_csv_fields = [
            field
            for field in get_employee_csv_fields().values()
            if field.name in EMPLOYEE_FIELDS
        ]
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            ['team']
            + [field.name for field in employee_csv_fields]
            + [field.label for field in fields_metadata]
        )
        for item in self.items:
            for data in item.items:
                writer.writerow(
                    [item.team.name]
                    + [
                        field.csv_getter(data.raw_employee)
                        for field in employee_csv_fields
                    ]
                    + [str(getattr(data, field.name)) for field in fields_metadata]
                )
        return output
