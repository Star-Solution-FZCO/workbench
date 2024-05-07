import typing as t
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel

import wb.models as m
from wb.models import CounterAgentStatus
from wb.schemas import BaseOutModel, SelectEmployeeField, SelectFieldInt
from wb.schemas.employee.base_schemas import ShortEmployeeOut
from wb.services.credentials import BundleConfig, CredentialsNotification
from wb.utils.current_user import current_employee

__all__ = (
    'CounterAgentOut',
    'CounterAgentCreate',
    'CounterAgentUpdate',
    'CounterAgentChangeStatus',
    'CounterAgentCredentialsCreate',
    'CounterAgentCredentialsOut',
    'CounterAgentCredentialsUpload',
)


class Contact(BaseModel):
    type: str
    value: str


class CounterAgentOut(BaseOutModel['m.CounterAgent']):
    id: int
    english_name: str
    username: str
    email: str
    contacts: list[Contact]
    group: bool
    parent: SelectFieldInt | None
    agents: list[SelectFieldInt]
    team: SelectFieldInt | None
    team_required: bool
    manager: SelectEmployeeField
    organization: SelectFieldInt | None
    status: str
    schedule: str
    can_edit: bool
    created: datetime
    updated: datetime

    @classmethod
    def from_obj(cls, obj: 'm.CounterAgent') -> t.Self:
        user = current_employee()
        is_manager = obj.manager_id == user.id
        can_edit = (
            user.is_admin or is_manager
        ) and obj.status != CounterAgentStatus.INVALID
        return cls(
            id=obj.id,
            english_name=obj.english_name,
            username=obj.username,
            email=obj.email,
            contacts=obj.contacts,
            group=obj.group,
            parent=(
                SelectFieldInt.from_obj(obj.parent, label='english_name', value='id')
                if obj.parent
                else None
            ),
            agents=[
                SelectFieldInt.from_obj(agent, label='english_name', value='id')
                for agent in obj.agents
            ],
            team=(
                SelectFieldInt.from_obj(obj.team, label='name', value='id')
                if obj.team
                else None
            ),
            team_required=obj.team_required,
            manager=SelectEmployeeField.from_obj(obj.manager),
            organization=(
                SelectFieldInt.from_obj(obj.organization, label='name', value='id')
                if obj.organization
                else None
            ),
            status=obj.status.value,
            schedule=obj.schedule,
            can_edit=can_edit,
            created=obj.created,
            updated=obj.updated,
        )


class CounterAgentCreate(BaseModel):
    english_name: str
    username: str | None = None
    email: str
    contacts: list[Contact]
    group: bool
    parent: SelectFieldInt | None = None
    agents: list[SelectFieldInt] | None = None
    manager: SelectEmployeeField
    team: SelectFieldInt | None = None
    team_required: bool
    organization: SelectFieldInt | None = None
    schedule: str
    apply_subagents: bool | None = None


class CounterAgentUpdate(BaseModel):
    english_name: str | None = None
    username: str | None = None
    email: str | None = None
    contacts: list[Contact] | None = None
    group: bool | None = None
    parent: SelectFieldInt | None = None
    agents: list[SelectFieldInt] | None = None
    team: SelectFieldInt | None = None
    team_required: bool | None = None
    manager: SelectEmployeeField | None = None
    organization: SelectFieldInt | None = None
    schedule: str | None = None
    apply_subagents: bool | None = None


class CounterAgentChangeStatus(BaseModel):
    agents: list[int]
    apply_subagents: bool


class CounterAgentCredentialsOut(BaseOutModel['m.CounterAgentCredentials']):
    id: int
    counteragent_id: int
    created_by: ShortEmployeeOut
    request_id: str | None
    notifications: list[dict[str, t.Any]]
    bundle: dict[str, t.Any]
    status: str
    created: datetime
    updated: datetime

    @classmethod
    def from_obj(cls, obj: 'm.CounterAgentCredentials') -> t.Self:
        return cls(
            id=obj.id,
            counteragent_id=obj.counteragent_id,
            created_by=ShortEmployeeOut.from_obj(obj.created_by),
            request_id=obj.request_id,
            notifications=obj.notifications,
            bundle=obj.bundle,
            status=obj.status,
            created=obj.created,
            updated=obj.updated,
        )


class CounterAgentCredentialsCreate(BaseModel):
    notifications: list[CredentialsNotification]
    bundle: BundleConfig
    ca: int


class CredentialsType(StrEnum):
    SSH = 'ssh'
    OPENVPN = 'openvpn'
    CERTIFICATE = 'certificate'
    PVPN = 'pvpn'


class CounterAgentCredentialsUpload(BaseModel):
    type: CredentialsType
    url: str


class CounterAgentCredentialsCollect(BaseModel):
    rid: str
    credentials: dict[str, dict]
