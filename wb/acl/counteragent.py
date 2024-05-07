import wb.models as m

from ._base import FieldACL

COUNTERAGENT_FIELD_ACL: dict[str, FieldACL[m.CounterAgent]] = {
    'id': FieldACL(
        edit=frozenset(),
        view=frozenset({'all'}),
    ),
    'english_name': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr'}),
        view=frozenset({'all'}),
    ),
    'username': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr'}),
        view=frozenset({'all'}),
    ),
    'email': FieldACL(
        edit=frozenset({'super_admin'}),
        view=frozenset({'all'}),
    ),
    'contacts': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr'}),
        view=frozenset({'all'}),
    ),
    'group': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr'}),
        view=frozenset({'all'}),
    ),
    'parent': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr'}),
        view=frozenset({'all'}),
    ),
    'manager': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr'}),
        view=frozenset({'all'}),
    ),
    'organization': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr'}),
        view=frozenset({'all'}),
    ),
    'team': FieldACL(
        edit=({'super_admin', 'admin', 'super_hr', 'hr'}),
        view=frozenset({'all'}),
    ),
    'team_required': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr'}),
        view=frozenset({'all'}),
    ),
    'status': FieldACL(
        edit=frozenset({'super_admin', 'admin', 'super_hr', 'hr'}),
        view=frozenset({'all'}),
    ),
    'created': FieldACL(
        edit=frozenset({}),
        view=frozenset({'all'}),
    ),
}
