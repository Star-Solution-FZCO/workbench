from typing import Any

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql.json import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from wb.config import CONFIG

from ..employee import Employee
from .request import Request

__all__ = ('AddEmployeeRequest',)


class AddEmployeeRequest(Request):
    __tablename__ = 'requests__add_employee'
    __request_type__: str = 'ADD_EMPLOYEE'

    id: Mapped[int] = mapped_column(primary_key=True)
    approved_by_hr_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey(
            'employees.id', name='requests__add_employee_approved_by_hr_id_fkey'
        )
    )
    approved_by_hr: Mapped[Employee | None] = relationship(
        foreign_keys=[approved_by_hr_id], lazy='selectin'
    )
    approved_by_admin_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey(
            'employees.id', name='requests__add_employee_approved_by_admin_id_fkey'
        )
    )
    approved_by_admin: Mapped[Employee | None] = relationship(
        foreign_keys=[approved_by_admin_id], lazy='selectin'
    )
    employee_data: Mapped[dict[str, Any]] = mapped_column(
        JSONB(none_as_null=True), server_default=sa.text("'{}'::jsonb")
    )
    onboarding_data: Mapped[str]

    @property
    def link(self):
        return f'[View request in Workbench]({CONFIG.PUBLIC_BASE_URL}/requests/add-employee/{self.id})'
