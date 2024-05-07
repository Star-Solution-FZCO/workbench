import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from wb.db import BaseDBModel

__all__ = ('EmployeeActivitySourceAlias',)


class EmployeeActivitySourceAlias(BaseDBModel):
    __tablename__ = 'employee__activity_source_aliases'
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id',
            ondelete='CASCADE',
            name='employee__activity_source_aliases_employee_id_fkey',
        ),
        primary_key=True,
    )
    source_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'activity_sources.id',
            name='employee__activity_source_aliases_source_id_fkey',
        ),
        primary_key=True,
    )
    alias: Mapped[str]
