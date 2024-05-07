import typing as t
from datetime import datetime

from pydantic import BaseModel

from wb.schemas import BaseOutModel, SelectEmployeeField
from wb.utils.current_user import current_employee

if t.TYPE_CHECKING:
    import wb.models as m


__all__ = (
    'DismissEmployeeRequestApprove',
    'DismissEmployeeRequestOut',
    'DismissEmployeeRequestCreate',
    'DismissEmployeeRequestUpdate',
)


class DismissEmployeeRequestOut(BaseOutModel['m.DismissEmployeeRequest']):
    id: int
    type: str
    status: str
    updated: datetime
    created_by: SelectEmployeeField
    approved_by: SelectEmployeeField | None
    checklist_checked: bool
    dismiss_datetime: datetime
    description: str | None
    employee: SelectEmployeeField
    can_approve: bool
    can_update: bool
    can_cancel: bool
    youtrack_issue_id: str

    @classmethod
    def from_obj(cls, obj: 'm.DismissEmployeeRequest') -> t.Self:
        user = current_employee()
        can_approve = False
        can_update = bool({'super_hr', 'hr', 'recruiter'}.intersection(set(user.roles)))
        if user.is_admin and obj.approved_by_id is None:
            can_approve = True
        if obj.status in ('CANCELED', 'CLOSED', 'APPROVED'):
            can_update = False
            can_approve = False
        return cls(
            id=obj.id,
            type=obj.type,
            status=obj.status,
            updated=obj.updated,
            created_by=SelectEmployeeField.from_obj(obj.created_by),
            approved_by=(
                SelectEmployeeField.from_obj(obj.approved_by)
                if obj.approved_by
                else None
            ),
            checklist_checked=obj.checklist_checked,
            dismiss_datetime=obj.dismiss_datetime,
            description=obj.description,
            employee=SelectEmployeeField.from_obj(obj.employee),
            can_cancel=can_approve,
            can_update=can_update,
            can_approve=can_approve,
            youtrack_issue_id=obj.youtrack_issue_id,
        )


class DismissEmployeeRequestCreate(BaseModel):
    type: str
    employee_id: int
    dismiss_datetime: datetime
    description: str | None = None


class DismissEmployeeRequestUpdate(BaseModel):
    dismiss_datetime: datetime | None = None
    description: str | None = None


class DismissEmployeeRequestApprove(BaseModel):
    checklist_checked: bool
