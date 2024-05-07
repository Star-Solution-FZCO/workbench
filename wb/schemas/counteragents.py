from collections.abc import Callable
from datetime import datetime

from pydantic import EmailStr

import wb.models as m
from wb.acl.counteragent import COUNTERAGENT_FIELD_ACL
from wb.schemas._base import ModelFieldAnnotation, SelectFieldInt
from wb.utils.current_user import get_current_roles_employee_related

from ._base import SelectField
from .employee.base_schemas import SelectEmployeeField

__all__ = (
    'COUNTERAGENT_FIELD_ANNOTATIONS',
    'get_counteragent_csv_fields',
)


def get_manager(obj: 'm.CounterAgent') -> SelectEmployeeField:
    return SelectEmployeeField.from_obj(obj.manager)


def get_parent(obj: 'm.CounterAgent') -> SelectField:
    return SelectField.from_obj(obj.parent, label='email', value='id')


def catalog_attr_getter(
    field: str,
) -> Callable[['m.CounterAgent'], SelectFieldInt | None]:
    def _get(obj: 'm.CounterAgent') -> SelectFieldInt | None:
        if not (val := getattr(obj, field)):
            return None
        return SelectFieldInt.from_obj(val, label='name', value='id')

    return _get


def is_employee_field_viewable(field: str, emp: m.Employee | None = None) -> bool:
    if not (acl := COUNTERAGENT_FIELD_ACL.get(field)):
        return False
    return acl.can_view(get_current_roles_employee_related, emp)


COUNTERAGENT_FIELD_ANNOTATIONS: dict[str, ModelFieldAnnotation[m.Employee]] = {
    'id': ModelFieldAnnotation(
        name='id',
        type=int,
    ),
    'english_name': ModelFieldAnnotation(
        name='english_name',
        type=str,
        csv_include=True,
    ),
    'username': ModelFieldAnnotation(
        name='username',
        type=str,
        csv_include=True,
    ),
    'email': ModelFieldAnnotation(
        name='email',
        type=EmailStr,
        csv_include=True,
    ),
    'manager': ModelFieldAnnotation(
        name='manager',
        type=SelectEmployeeField,
        _getter=get_manager,
        csv_include=True,
        _csv_getter=lambda obj: obj.manager.email,
    ),
    'parent': ModelFieldAnnotation(
        name='parent',
        type=SelectField | None,
        _getter=get_parent,
        csv_include=True,
        _csv_getter=lambda obj: obj.parent.email if obj.parent else '',
    ),
    'organization': ModelFieldAnnotation(
        name='organization',
        type=SelectFieldInt | None,
        _getter=catalog_attr_getter('organization'),
        csv_include=True,
        _csv_getter=lambda obj: obj.organization.name if obj.organization else '',
    ),
    'team': ModelFieldAnnotation(
        name='team',
        type=SelectFieldInt | None,
        _getter=catalog_attr_getter('team'),
        csv_include=True,
        _csv_getter=lambda obj: obj.team.name if obj.team else '',
    ),
    'team_required': ModelFieldAnnotation(
        name='team_required',
        type=bool,
        csv_include=True,
    ),
    'status': ModelFieldAnnotation(
        name='status',
        type=str,
        csv_include=True,
    ),
    'group': ModelFieldAnnotation(
        name='group',
        type=bool,
        csv_include=True,
    ),
    'created': ModelFieldAnnotation(
        name='created',
        type=datetime,
        csv_include=True,
    ),
}


def get_counteragent_csv_fields(
    emp: m.Employee | None = None,
) -> list[ModelFieldAnnotation]:
    return [
        annotation
        for annotation in COUNTERAGENT_FIELD_ANNOTATIONS.values()
        if annotation.csv_include
        and is_employee_field_viewable(annotation.name, emp=emp)
    ]
