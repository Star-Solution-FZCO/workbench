from datetime import date, datetime

from pydantic import EmailStr

import wb.models as m
from wb.acl import is_employee_field_viewable
from wb.schemas._base import ModelFieldAnnotation, SelectField, SelectFieldInt

from .base_schemas import SelectEmployeeField
from .fields import (
    EmployeeAvailabilityTimeField,
    EmployeeGradeFieldOut,
    catalog_attr_getter,
    get_availability_time,
    get_grade,
    get_managers,
    get_mentors,
    get_timezone,
    get_watchers,
    is_current_user_in_list_field_getter,
    is_current_user_team_lead,
    list_attr_getter,
)

__all__ = (
    'EMPLOYEE_FIELD_ANNOTATIONS',
    'get_employee_csv_fields',
)


EMPLOYEE_FIELD_ANNOTATIONS: dict[str, ModelFieldAnnotation[m.Employee]] = {
    'id': ModelFieldAnnotation(
        name='id',
        type=int,
    ),
    'account': ModelFieldAnnotation(
        name='account',
        type=str,
        csv_include=True,
    ),
    'english_name': ModelFieldAnnotation(
        name='english_name',
        type=str,
        csv_include=True,
    ),
    'native_name': ModelFieldAnnotation(
        name='native_name',
        type=str | None,
        csv_include=True,
    ),
    'email': ModelFieldAnnotation(
        name='email',
        type=EmailStr,
        csv_include=True,
    ),
    'public_contacts': ModelFieldAnnotation(
        name='public_contacts',
        type=str | None,
        csv_include=True,
    ),
    'work_started': ModelFieldAnnotation(
        name='work_started',
        type=date,
        csv_include=True,
        _csv_getter=lambda obj: obj.work_started.strftime('%d %b %Y'),
    ),
    'work_ended': ModelFieldAnnotation(
        name='work_ended',
        type=date | None,
        csv_include=True,
        _csv_getter=lambda obj: (
            obj.work_ended.strftime('%d %b %Y') if obj.work_ended else ''
        ),
    ),
    'managers': ModelFieldAnnotation(
        name='managers',
        type=list[SelectEmployeeField],
        _getter=get_managers,
        csv_include=True,
        _csv_getter=lambda obj: ' '.join([emp.email for emp in obj.managers]),
    ),
    'mentors': ModelFieldAnnotation(
        name='mentors',
        type=list[SelectEmployeeField],
        _getter=get_mentors,
        csv_include=True,
        _csv_getter=lambda obj: ' '.join([emp.email for emp in obj.mentors]),
    ),
    'watchers': ModelFieldAnnotation(
        name='watchers',
        type=list[SelectEmployeeField],
        _getter=get_watchers,
    ),
    'projects': ModelFieldAnnotation(
        name='projects',
        type=list[str],
        _getter=list_attr_getter('projects'),
        csv_include=True,
        _csv_getter=lambda obj: ' '.join(obj.projects),
    ),
    'position': ModelFieldAnnotation(
        name='position',
        type=SelectFieldInt | None,
        _getter=catalog_attr_getter('position'),
        csv_include=True,
        _csv_getter=lambda obj: obj.position.name if obj.position else '',
    ),
    'team': ModelFieldAnnotation(
        name='team',
        type=SelectFieldInt | None,
        _getter=catalog_attr_getter('team'),
        csv_include=True,
        _csv_getter=lambda obj: obj.team.name if obj.team else '',
    ),
    'team_position': ModelFieldAnnotation(
        name='team_position',
        type=str | None,
        csv_include=True,
    ),
    'photo': ModelFieldAnnotation(
        name='photo',
        type=str | None,
    ),
    'skills': ModelFieldAnnotation(
        name='skills',
        type=list[str],
        _getter=list_attr_getter('skills'),
    ),
    'birthday': ModelFieldAnnotation(
        name='birthday',
        type=date | None,
    ),
    'pararam': ModelFieldAnnotation(
        name='pararam',
        type=str | None,
        csv_include=True,
    ),
    'about': ModelFieldAnnotation(
        name='about',
        type=str | None,
    ),
    'timezone': ModelFieldAnnotation(
        name='timezone',
        type=SelectField,
        _getter=get_timezone,
    ),
    'availability_time': ModelFieldAnnotation(
        name='availability_time',
        type=EmployeeAvailabilityTimeField | None,
        _getter=get_availability_time,
    ),
    'active': ModelFieldAnnotation(
        name='active',
        type=bool,
        csv_include=True,
    ),
    'is_current_user_watch': ModelFieldAnnotation(
        name='is_current_user_watch',
        type=bool,
        _getter=is_current_user_in_list_field_getter('watchers'),
    ),
    'is_current_user_team_lead': ModelFieldAnnotation(
        name='is_current_user_team_lead',
        type=bool,
        _getter=is_current_user_team_lead,
    ),
    'is_current_user_manager': ModelFieldAnnotation(
        name='is_current_user_manager',
        type=bool,
        _getter=is_current_user_in_list_field_getter('managers'),
    ),
    'is_current_user_mentor': ModelFieldAnnotation(
        name='is_current_user_mentor',
        type=bool,
        _getter=is_current_user_in_list_field_getter('mentors'),
    ),
    'roles': ModelFieldAnnotation(
        name='roles',
        type=list[SelectField],
        _getter=lambda obj: [SelectField(value=r, label=r) for r in obj.roles],
    ),
    'grade': ModelFieldAnnotation(
        name='grade',
        type=EmployeeGradeFieldOut | None,
        _getter=get_grade,
        csv_include=True,
    ),
    'grade_updated': ModelFieldAnnotation(
        name='grade_updated',
        type=datetime | None,
        csv_include=True,
        _csv_getter=lambda obj: (
            obj.grade_updated.strftime('%d %b %Y') if obj.grade_updated else ''
        ),
    ),
    'organization': ModelFieldAnnotation(
        name='organization',
        type=SelectFieldInt | None,
        _getter=catalog_attr_getter('organization'),
        csv_include=True,
        _csv_getter=lambda obj: obj.organization.name if obj.organization else '',
    ),
    'cooperation_type': ModelFieldAnnotation(
        name='cooperation_type',
        type=SelectFieldInt | None,
        _getter=catalog_attr_getter('cooperation_type'),
        csv_include=True,
        _csv_getter=lambda obj: (
            obj.cooperation_type.name if obj.cooperation_type else ''
        ),
    ),
    'contract_date': ModelFieldAnnotation(
        name='contract_date',
        type=date | None,
        csv_include=True,
        _csv_getter=lambda obj: (
            obj.contract_date.strftime('%d %b %Y') if obj.contract_date else ''
        ),
    ),
    'work_notifications_chats': ModelFieldAnnotation(
        name='work_notifications_chats',
        type=list[int],
        _getter=list_attr_getter('work_notifications_chats'),
    ),
    'created': ModelFieldAnnotation(
        name='created',
        type=datetime,
    ),
    'dismissal_reason': ModelFieldAnnotation(
        name='dismissal_reason',
        type=str | None,
    ),
    'probation_period_justification': ModelFieldAnnotation(
        name='probation_period_justification',
        type=str | None,
    ),
    'probation_period_started': ModelFieldAnnotation(
        name='probation_period_started',
        type=date | None,
    ),
    'probation_period_ended': ModelFieldAnnotation(
        name='probation_period_ended',
        type=date | None,
    ),
    'today_schedule_status': ModelFieldAnnotation(
        name='today_schedule_status',
        type=m.DayType,
        csv_include=False,
        extra=True,
    ),
    'disable_activity_monitor': ModelFieldAnnotation(
        name='disable_activity_monitor',
        type=bool,
        csv_include=False,
    ),
    'pool': ModelFieldAnnotation(
        name='pool',
        type=SelectFieldInt | None,
        _getter=catalog_attr_getter('pool'),
        csv_include=True,
        _csv_getter=lambda obj: obj.pool.name if obj.pool else '',
    ),
    'done_task_score': ModelFieldAnnotation(
        name='done_task_score',
        type=float,
        csv_include=False,
        extra=True,
    ),
}


def get_employee_csv_fields(
    emp: m.Employee | None = None,
) -> dict[str, ModelFieldAnnotation]:
    return {
        annotation.name: annotation
        for annotation in EMPLOYEE_FIELD_ANNOTATIONS.values()
        if annotation.csv_include and is_employee_field_viewable(annotation.name, emp)
    }
