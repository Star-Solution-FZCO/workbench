from collections.abc import Collection

import wb.models as m
from wb.acl.employee import list_employee_readable_fields
from wb.schemas._base import ModelOutPrototype

from .annotation import EMPLOYEE_FIELD_ANNOTATIONS

__all__ = (
    'EmployeePublicOutPrototype',
    'get_employee_output_model_class',
)

EmployeePublicOutPrototype = ModelOutPrototype[m.Employee]


def get_employee_output_model_class(
    emp: m.Employee | None = None,
    fields: Collection[str] | None = None,
) -> type['EmployeePublicOutPrototype']:
    field_list = [
        field
        for field in list_employee_readable_fields(emp)
        if field in EMPLOYEE_FIELD_ANNOTATIONS
    ]
    if fields is not None:
        field_list = [field for field in field_list if field in fields]
    model_fields = [
        (
            EMPLOYEE_FIELD_ANNOTATIONS[field],  # type: ignore
            (EMPLOYEE_FIELD_ANNOTATIONS[field].type, ...),
        )
        for field in field_list
    ]
    return EmployeePublicOutPrototype.with_fields(model_fields)
