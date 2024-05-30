import json
import typing as t
from datetime import datetime

from pydantic import BaseModel, Field

from wb.routes.v1.employee.schemas import EmployeeCreate
from wb.schemas import BaseOutModel, SelectEmployeeField, SelectFieldInt
from wb.utils.current_user import current_employee

if t.TYPE_CHECKING:
    import wb.models as m


__all__ = (
    'AddEmployeeRequestOut',
    'AddEmployeeRequestCreate',
    'AddEmployeeRequestUpdate',
    'OnboardingData',
)


class EmployeeData(EmployeeCreate):
    account: str


class CalendarEvent(BaseModel):
    id: str
    link: str


class OnboardingData(BaseModel):
    start: datetime
    end: datetime
    summary: str | None = None
    description: str | None = None
    google_calendar_event_id: str | None = None
    google_calendar_event_link: str | None = None
    youtrack_issue_id: str | None = None
    contacts: str | None = None
    work_mode: str | None = None
    comment: str | None = None
    organization: str | SelectFieldInt | None = None
    calendar_events: list[CalendarEvent] | None = None


class AddEmployeeRequestOut(BaseOutModel['m.AddEmployeeRequest']):
    id: int
    type: str
    status: str
    updated: datetime
    created_by: SelectEmployeeField
    approved_by_hr: SelectEmployeeField | None
    approved_by_admin: SelectEmployeeField | None
    employee_data: EmployeeData
    onboarding_data: OnboardingData
    can_approve_hr: bool
    can_approve_admin: bool
    can_cancel: bool
    can_update: bool

    @classmethod
    def from_obj(cls, obj: 'm.AddEmployeeRequest') -> t.Self:
        today = datetime.today().date()
        user = current_employee()
        user_roles = set(user.roles)
        has_access = bool({'hr', 'recruiter', 'super_hr'}.intersection(user_roles))
        user_hr_or_recruiter = bool(
            {'hr', 'recruiter', 'super_hr'}.intersection(user_roles)
        )
        can_update = obj.status not in ('CANCELED', 'CLOSED', 'APPROVED') and has_access
        can_approve_hr, can_approve_admin = False, False
        if user_hr_or_recruiter and obj.approved_by_hr_id is None:
            can_approve_hr = True
        work_started = datetime.strptime(
            obj.employee_data['work_started'], '%Y-%m-%d'
        ).date()
        if user.is_admin and obj.approved_by_admin_id is None and work_started <= today:
            can_approve_admin = True
        if obj.status in ('CANCELED', 'CLOSED', 'APPROVED'):
            can_approve_hr, can_approve_admin = False, False
        return cls(
            id=obj.id,
            type=obj.type,
            status=obj.status,
            updated=obj.updated,
            created_by=SelectEmployeeField.from_obj(obj.created_by),
            approved_by_hr=(
                SelectEmployeeField.from_obj(obj.approved_by_hr)
                if obj.approved_by_hr
                else None
            ),
            approved_by_admin=(
                SelectEmployeeField.from_obj(obj.approved_by_admin)
                if obj.approved_by_admin
                else None
            ),
            employee_data=obj.employee_data,
            onboarding_data=json.loads(obj.onboarding_data),
            can_cancel=can_update,
            can_update=can_update,
            can_approve_hr=can_approve_hr,
            can_approve_admin=can_approve_admin,
        )


class AddEmployeeRequestCreate(BaseModel):
    employee_data: EmployeeCreate
    onboarding_data: OnboardingData


class AddEmployeeRequestUpdate(BaseModel):
    employee_data: EmployeeCreate
    onboarding_data: OnboardingData


class AddEmployeeRequestApprove(BaseModel):
    role: str = Field(choices=['hr', 'admin'])
