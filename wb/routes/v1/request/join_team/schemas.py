import typing as t
from datetime import datetime

from pydantic import BaseModel

from wb.schemas import BaseOutModel, SelectEmployeeField, SelectFieldInt
from wb.utils.current_user import current_employee

if t.TYPE_CHECKING:
    import wb.models as m


__all__ = (
    'JoinTeamRequestOut',
    'JoinTeamRequestClose',
    'JoinTeamRequestCloseBulk',
    'JoinTeamRequestCreatePayload',
)


class JoinTeamRequestOut(BaseOutModel['m.RequestTeamJoin']):
    id: int
    created_by: SelectEmployeeField
    closed_by: SelectEmployeeField | None
    type: str
    status: str
    reason: str | None
    data: dict[str, t.Any]
    can_cancel: bool
    can_approve: bool
    subject: str
    updated: datetime

    @classmethod
    def from_obj(cls, obj: 'm.JoinTeamRequest') -> t.Self:
        user = current_employee()
        data = {
            'id': obj.id,
            'can_cancel': False,
            'can_approve': False,
            'status': obj.status,
            'subject': obj.subject,
            'type': obj.type,
            'reason': obj.reason,
            'created_by': SelectEmployeeField.from_obj(obj.created_by),
            'closed_by': (
                SelectEmployeeField.from_obj(t.cast('m.Employee', obj.closed_by))
                if obj.closed_by
                else None
            ),
            'data': {},
            'updated': obj.updated,
        }
        if obj.type == 'JOIN_TEAM':
            data['can_cancel'] = (obj.status != 'CLOSED') and (
                obj.created_by_id == user.id
                or (bool(obj.team) and obj.team.manager_id == user.id)
            )
            can_approve = False
            if obj.status in ('CLOSED', 'APPROVED'):
                can_approve = False
            elif bool(obj.team) and bool(obj.applicant):
                if obj.created_by_id != user.id and user.id in (
                    obj.team.manager_id,
                    obj.applicant_id,
                ):
                    can_approve = True
                if obj.team.manager_id == obj.applicant_id:
                    can_approve = True
            data['can_approve'] = can_approve
            data['data'] = {
                'date': obj.updated,
                'employee': SelectEmployeeField.from_obj(obj.applicant),
                'team': SelectFieldInt.from_obj(obj.team, label='name', value='id'),
                'message': obj.message,
            }
        return cls(**data)  # type: ignore


class JoinTeamRequestClose(BaseModel):
    reason: str


class JoinTeamRequestCloseBulk(BaseModel):
    reason: str
    ids: list[int]


class JoinTeamRequestCreatePayload(BaseModel):
    employee: SelectEmployeeField
    date: datetime
    team: SelectFieldInt
    message: str | None = None
