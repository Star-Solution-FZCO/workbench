from datetime import datetime
from typing import Callable, List, Optional

from pydantic import BaseModel, Field

import wb.models as m
from wb.schemas._base import SelectField, SelectFieldInt
from wb.utils.current_user import current_user

from .base_schemas import SelectEmployeeField

__all__ = (
    'EmployeeGradeFieldOut',
    'EmployeeGradeFieldUpdate',
    'EmployeeAvailabilityTimeField',
    'EmployeeLinkedAccountOut',
    'get_grade',
    'get_timezone',
    'get_managers',
    'get_mentors',
    'get_watchers',
    'get_availability_time',
    'get_linked_accounts',
    'is_current_user_team_lead',
    'catalog_attr_getter',
    'list_attr_getter',
    'is_current_user_in_list_field_getter',
)

HOUR_MINUTE_STR_PATTERN = r'([0-1]\d|2[0-3]):[0-5]\d'


class EmployeeGradeFieldOut(BaseModel):
    grade: str
    updated: datetime
    reason: Optional[str]


class LinkedAccountSourceOut(BaseModel):
    id: int
    type: str
    name: str
    description: str | None
    active: bool
    public: bool

    @classmethod
    def from_obj(cls, obj: 'm.LinkedAccountSource') -> 'LinkedAccountSourceOut':
        return cls(
            id=obj.id,
            type=obj.type,
            name=obj.name,
            description=obj.description,
            active=obj.active,
            public=obj.public,
        )


class EmployeeLinkedAccountOut(BaseModel):
    source: LinkedAccountSourceOut
    account_id: str
    active: bool | None


class EmployeeGradeFieldUpdate(BaseModel):
    grade: Optional[SelectField]
    reason: str


class EmployeeAvailabilityTimeField(BaseModel):
    start: str = Field(..., pattern=HOUR_MINUTE_STR_PATTERN)
    end: str = Field(..., pattern=HOUR_MINUTE_STR_PATTERN)


def get_grade(obj: 'm.Employee') -> EmployeeGradeFieldOut | None:
    if not obj.grade:
        return None
    return EmployeeGradeFieldOut(
        grade=obj.grade,
        updated=obj.grade_updated,
        reason=obj.grade_reason,
    )


def get_linked_accounts(obj: 'm.Employee') -> List[EmployeeLinkedAccountOut]:
    curr_user = current_user()
    return [
        EmployeeLinkedAccountOut(
            source=LinkedAccountSourceOut.from_obj(acc.source),
            account_id=acc.account_id,
            active=acc.active,
        )
        for acc in obj.linked_accounts
        if acc.source.public or curr_user.id == obj.id
    ]


def get_availability_time(obj: 'm.Employee') -> Optional[EmployeeAvailabilityTimeField]:
    if not obj.availability_time_start or not obj.availability_time_end:
        return None
    return EmployeeAvailabilityTimeField(
        start=obj.availability_time_start, end=obj.availability_time_end
    )


def get_timezone(obj: 'm.Employee') -> SelectField:
    return SelectField(value=obj.timezone, label=obj.timezone)


def get_managers(obj: 'm.Employee') -> List[SelectEmployeeField]:
    return [SelectEmployeeField.from_obj(u) for u in obj.managers]


def get_mentors(obj: 'm.Employee') -> List[SelectEmployeeField]:
    return [SelectEmployeeField.from_obj(u) for u in obj.mentors]


def get_watchers(obj: 'm.Employee') -> List[SelectEmployeeField]:
    return [SelectEmployeeField.from_obj(u) for u in obj.watchers]


def catalog_attr_getter(
    field: str,
) -> Callable[['m.Employee'], SelectFieldInt | None]:
    def _get(obj: 'm.Employee') -> SelectFieldInt | None:
        if not (val := getattr(obj, field)):
            return None
        return SelectFieldInt.from_obj(val, label='name', value='id')

    return _get


def list_attr_getter(field: str) -> Callable[['m.Employee'], Optional[List]]:
    def _get(obj: 'm.Employee') -> Optional[List]:
        val = getattr(obj, field)
        if val is None:
            val = []
        return list(val)

    return _get


def is_current_user_in_list_field_getter(field: str) -> Callable[['m.Employee'], bool]:
    def _get(obj: 'm.Employee') -> bool:
        curr_user = current_user()
        if not isinstance(curr_user, m.Employee):
            return False
        for w in getattr(obj, field):
            if w.id == curr_user.id:
                return True
        return False

    return _get


def is_current_user_team_lead(obj: 'm.Employee') -> bool:
    if not obj.team:
        return False
    curr_user = current_user()
    if not isinstance(curr_user, m.Employee):
        return False
    return bool(obj.team.manager_id == curr_user.id)
