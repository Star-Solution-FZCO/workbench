import wb.models as m
from wb.utils.current_user import get_current_roles_employee_related

from ._base import FieldACL, list_model_readable_fields

__all__ = (
    'EMPLOYEE_FIELD_ACL',
    'is_employee_field_viewable',
    'is_employee_field_editable',
    'list_employee_readable_fields',
)


EMPLOYEE_FIELD_ACL: dict[str, FieldACL[m.Employee]] = {
    'id': FieldACL(
        edit=frozenset(),
        view=frozenset({'all'}),
    ),
    'account': FieldACL(
        edit=frozenset({'super_admin'}),
        view=frozenset({'all'}),
    ),
    'english_name': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'self'}),
        view=frozenset({'all'}),
    ),
    'native_name': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'self'}),
        view=frozenset({'all'}),
    ),
    'email': FieldACL(
        edit=frozenset({'super_admin'}),
        view=frozenset({'all'}),
    ),
    'public_contacts': FieldACL(
        edit=frozenset({'self'}),
        view=frozenset({'all'}),
    ),
    'work_started': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr'}),
        view=frozenset({'all'}),
    ),
    'work_ended': FieldACL(
        edit=frozenset({'super_admin'}),
        view=frozenset({'all'}),
    ),
    'managers': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr', 'team_lead'}),
        view=frozenset({'all'}),
    ),
    'mentors': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr', 'team_lead'}),
        view=frozenset({'all'}),
    ),
    'watchers': FieldACL(
        edit=frozenset({'super_admin', 'admin'}),
        view=frozenset({'all'}),
    ),
    'projects': FieldACL(
        edit=frozenset({}),
        view=frozenset({'all'}),
    ),
    'position': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr', 'recruiter'}),
        view=frozenset({'all'}),
    ),
    'team': FieldACL(
        edit=lambda emp: (
            frozenset({'super_admin', 'admin', 'team_lead'})
            if emp is None or emp.team
            else frozenset({'super_admin', 'admin', 'team_lead', 'super_hr'})
        ),
        view=frozenset({'all'}),
    ),
    'team_position': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'team_lead'}),
        view=frozenset({'all'}),
    ),
    'photo': FieldACL(
        edit=frozenset({}),
        view=frozenset({'self'}),
    ),
    'skills': FieldACL(
        edit=frozenset({'self'}),
        view=frozenset({'all'}),
    ),
    'birthday': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'self'}),
        view=frozenset({'super_admin', 'admin', 'super_hr', 'hr', 'self', 'chief'}),
    ),
    'pararam': FieldACL(
        edit=frozenset({'super_admin', 'admin'}),
        view=frozenset({'all'}),
    ),
    'about': FieldACL(
        edit=frozenset({'self'}),
        view=frozenset({'all'}),
    ),
    'timezone': FieldACL(
        edit=frozenset({'self'}),
        view=frozenset({'all'}),
    ),
    'availability_time': FieldACL(
        edit=frozenset({'self'}),
        view=frozenset({'all'}),
    ),
    'active': FieldACL(
        edit=frozenset({'super_admin', 'admin'}),
        view=frozenset({'all'}),
    ),
    'is_current_user_watch': FieldACL(
        edit=frozenset({}),
        view=frozenset({'all'}),
    ),
    'is_current_user_team_lead': FieldACL(
        edit=frozenset({}),
        view=frozenset({'all'}),
    ),
    'is_current_user_manager': FieldACL(
        edit=frozenset({}),
        view=frozenset({'all'}),
    ),
    'is_current_user_mentor': FieldACL(
        edit=frozenset({}),
        view=frozenset({'all'}),
    ),
    'roles': FieldACL(
        edit=frozenset({'super_admin', 'admin'}),
        view=frozenset({'self', 'super_admin', 'admin'}),
    ),
    'grade': FieldACL(
        edit=frozenset({'super_hr', 'hr', 'manager'}),
        view=frozenset(
            {
                'super_hr',
                'hr',
                'manager',
                'self',
                'team_lead',
                'chief',
                'super_admin',
                'procurement',
            }
        ),
    ),
    'grade_updated': FieldACL(
        edit=frozenset({}),
        view=frozenset({'super_hr', 'hr', 'chief'}),
    ),
    'organization': FieldACL(
        edit=frozenset({'super_hr', 'hr'}),
        view=frozenset(
            {
                'super_hr',
                'hr',
                'finance',
                'lawyer',
                'self',
                'chief',
                'super_admin',
                'recruiter',
                'procurement',
            }
        ),
    ),
    'cooperation_type': FieldACL(
        edit=frozenset({'super_hr', 'hr'}),
        view=frozenset(
            {
                'super_hr',
                'hr',
                'finance',
                'lawyer',
                'self',
                'chief',
                'recruiter',
                'procurement',
            }
        ),
    ),
    'contract_date': FieldACL(
        edit=frozenset({'super_hr', 'hr'}),
        view=frozenset({'super_hr', 'hr', 'finance', 'lawyer', 'self', 'chief'}),
    ),
    'work_notifications_chats': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'team_lead', 'manager', 'self'}),
        view=frozenset({'super_admin', 'admin', 'team_lead', 'manager', 'self'}),
    ),
    'created': FieldACL(
        edit=frozenset({}),
        view=frozenset({'all'}),
    ),
    'dismissal_reason': FieldACL(
        edit=frozenset({'recruiter'}),
        view=frozenset({'mentor', 'manager', 'recruiter', 'chief'}),
    ),
    'probation_period_justification': FieldACL(
        edit=frozenset({'recruiter'}),
        view=frozenset({'mentor', 'manager', 'recruiter', 'chief', 'hr', 'super_hr'}),
    ),
    'probation_period_started': FieldACL(
        edit=frozenset({'recruiter'}),
        view=frozenset({'mentor', 'manager', 'recruiter', 'chief', 'hr', 'super_hr'}),
    ),
    'probation_period_ended': FieldACL(
        edit=frozenset({'recruiter'}),
        view=frozenset({'mentor', 'manager', 'recruiter', 'chief', 'hr', 'super_hr'}),
    ),
    'today_schedule_status': FieldACL(
        edit=frozenset(),
        view=frozenset({'all'}),
    ),
    'disable_activity_monitor': FieldACL(
        edit=frozenset({'manager', 'team_lead'}),
        view=frozenset({'all'}),
    ),
    'pool': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr', 'recruiter'}),
        view=frozenset(
            {'super_admin', 'admin', 'super_hr', 'hr', 'recruiter', 'procurement'}
        ),
    ),
    'holiday_set_id': FieldACL(
        edit=frozenset(),
        view=frozenset({'super_admin', 'super_hr', 'hr'}),
    ),
    'done_task_score': FieldACL(
        edit=frozenset(),
        view=frozenset({'all'}),
    ),
}


def is_employee_field_viewable(field: str, emp: m.Employee | None = None) -> bool:
    if not (acl := EMPLOYEE_FIELD_ACL.get(field)):
        return False
    return acl.can_view(get_current_roles_employee_related, emp)


def is_employee_field_editable(field: str, emp: m.Employee | None = None) -> bool:
    if not (acl := EMPLOYEE_FIELD_ACL.get(field)):
        return False
    return acl.can_edit(get_current_roles_employee_related, emp)


def list_employee_readable_fields(emp: m.Employee | None = None) -> list[str]:
    return list_model_readable_fields(
        acls=EMPLOYEE_FIELD_ACL,
        obj=emp,
        related_roles_getter=get_current_roles_employee_related,
    )
