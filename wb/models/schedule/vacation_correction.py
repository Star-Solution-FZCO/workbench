from datetime import datetime
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from wb.db import BaseDBModel

if TYPE_CHECKING:
    from wb.models.employee import Employee


__all__ = ('EmployeeVacationCorrection',)


class EmployeeVacationCorrection(BaseDBModel):
    __tablename__ = 'employee__vacation_correction'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id',
            ondelete='CASCADE',
            name='employee__vacation_correction_employee_id_fkey',
        )
    )
    days: Mapped[int]
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    created_by_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id', name='employee__vacation_correction_created_by_id_fkey'
        )
    )
    created_by: Mapped['Employee | None'] = relationship(
        foreign_keys=[created_by_id], lazy='selectin'
    )
    description: Mapped[str | None]
