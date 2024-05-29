import typing as t
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from wb.schemas import (
    SelectEmployeeField,
    SelectField,
    SelectFieldInt,
    ShortEmployeeOut,
)
from wb.schemas.employee.fields import (
    EmployeeAvailabilityTimeField,
    EmployeeGradeFieldUpdate,
)

__all__ = (
    'EmployeeCreate',
    'EmployeeDayStatusOut',
    'EmployeeDaysStatusOut',
    'EmployeeHierarchy',
    'EmployeeHierarchyOut',
    'EmployeeHistoryRecordOut',
    'EmployeeTMKeyUpdateOut',
    'EmployeeUpdate',
    'EmployeeRegisterOut',
)


class EmployeeCreate(BaseModel):
    account: str = Field(pattern=r'^[a-z0-9_.]+$')
    english_name: str
    native_name: str | None = None
    email: EmailStr
    work_started: date | datetime
    managers: list[SelectEmployeeField]
    mentors: list[SelectEmployeeField]
    position: SelectFieldInt | None = None
    team: SelectFieldInt | None = None
    team_position: str | None = None
    birthday: date | datetime | None = None
    active: bool
    roles: list[SelectField]
    pararam: str | None = None
    holiday_set: SelectFieldInt | None = None
    pool: SelectFieldInt | None = None


class EmployeeUpdate(BaseModel):
    account: str | None = Field(None, pattern=r'^[a-z0-9_.]+$')
    english_name: str | None = None
    native_name: str | None = None
    email: EmailStr | None = None
    work_started: date | datetime | None = None
    managers: list[SelectEmployeeField] | None = None
    mentors: list[SelectEmployeeField] | None = None
    watchers: list[SelectEmployeeField] | None = None
    position: SelectFieldInt | None = None
    team: SelectFieldInt | None = None
    team_position: str | None = None
    birthday: date | datetime | None = None
    active: bool | None = None
    roles: list[SelectField] | None = None
    organization: SelectFieldInt | None = None
    cooperation_type: SelectFieldInt | None = None
    contract_date: date | datetime | None = None
    public_contacts: str | None = None
    about: str | None = None
    skills: list[str] | None = None
    timezone: SelectField | None = None
    availability_time: EmployeeAvailabilityTimeField | None = None
    grade: EmployeeGradeFieldUpdate | None = None
    work_notifications_chats: list[int] | None = None
    pararam: str | None = None
    dismissal_reason: str | None = None
    probation_period_justification: str | None = None
    probation_period_started: date | datetime | None = None
    probation_period_ended: date | datetime | None = None
    pool: SelectFieldInt | None = None


class EmployeeHistoryRecordOut(BaseModel):
    action: str
    time: datetime
    # object: m.SelectField


class EmployeeTMKeyUpdateOut(BaseModel):
    tm_key: str


class EmployeeDayStatusOut(BaseModel):
    type: str


class EmployeeDaysStatusOut(BaseModel):
    employee: ShortEmployeeOut
    dates: dict[date, EmployeeDayStatusOut]


class EmployeeHierarchy(t.TypedDict):
    name: str
    attributes: SelectEmployeeField | None
    children: list['EmployeeHierarchy']


class EmployeeHierarchyOut(BaseModel):
    name: str
    attributes: SelectEmployeeField | None
    children: list['EmployeeHierarchyOut']

    @classmethod
    def from_obj(cls, obj: EmployeeHierarchy) -> 'EmployeeHierarchyOut':
        return cls(
            name=obj['name'],
            attributes=obj['attributes'],
            children=[cls.from_obj(child) for child in obj['children']],
        )


class EmployeeRegisterOut(BaseModel):
    register_token: str
