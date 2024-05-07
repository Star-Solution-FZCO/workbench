from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared_utils.sql import StringEnum
from wb.db import BaseDBModel

from ._base import DAY_TYPE_FIELD_MAX_LENGTH, DayType

if TYPE_CHECKING:
    from wb.models.employee import Employee


__all__ = ('EmployeeScheduleExclusion',)


class EmployeeScheduleExclusion(BaseDBModel):
    __tablename__ = 'employee__schedule_exclusions'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id',
            ondelete='CASCADE',
            name='employee__schedule_exclusions_employee_id_fkey',
        )
    )
    day: Mapped[date]
    guid: Mapped[str]
    type: Mapped[DayType] = mapped_column(
        StringEnum['DayType'](DayType, DAY_TYPE_FIELD_MAX_LENGTH)
    )
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    created_by_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id', name='employee__schedule_exclusions_created_by_id_fkey'
        )
    )
    canceled: Mapped[Optional[datetime]]
    canceled_by_id: Mapped[Optional[int]] = mapped_column(
        sa.ForeignKey(
            'employees.id', name='employee__schedule_exclusions_canceled_by_id_fkey'
        )
    )
    canceled_by: Mapped[Optional['Employee']] = relationship(
        foreign_keys=[canceled_by_id], lazy='selectin'
    )


sa.Index(
    'uc__employee__schedule_exclusions__employee_id__day',
    EmployeeScheduleExclusion.employee_id,
    EmployeeScheduleExclusion.day,
    unique=True,
    postgresql_where=EmployeeScheduleExclusion.canceled.is_(None),
)
