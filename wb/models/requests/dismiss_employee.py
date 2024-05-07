from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from wb.config import CONFIG

from ..employee import Employee
from .request import Request

__all__ = ('DismissEmployeeRequest',)


class DismissEmployeeRequest(Request):
    __tablename__ = 'requests__dismiss_employee'
    __request_type__: str = 'ADD_EMPLOYEE'

    id: Mapped[int] = mapped_column(primary_key=True)
    approved_by_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey(
            'employees.id', name='requests__dismiss_employee_approved_by_id_fkey'
        )
    )
    approved_by: Mapped[Employee | None] = relationship(
        foreign_keys=[approved_by_id], lazy='selectin'
    )
    employee_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey(
            'employees.id', name='requests__dismiss_employee_employee_id_fkey'
        ),
    )
    employee: Mapped[Employee | None] = relationship(
        foreign_keys=[employee_id], lazy='selectin'
    )
    dismiss_datetime: Mapped[datetime]
    description: Mapped[str | None]
    checklist_checked: Mapped[bool] = mapped_column(default=False)
    youtrack_issue_id: Mapped[str]

    @property
    def link(self):
        return f'[View request in Workbench]({CONFIG.PUBLIC_BASE_URL}/requests/dismiss-employee/{self.id})'
