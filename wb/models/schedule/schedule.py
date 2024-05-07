from datetime import date
from typing import TYPE_CHECKING, Optional

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from wb.constants import (
    DEFAULT_SCHEDULE_DAYS_OF_WEEK_BITS,
    DEFAULT_VACATION_DAYS_PER_YEAR,
)
from wb.db import BaseDBModel

from ._base import DayType
from .holiday import HolidaySet

if TYPE_CHECKING:
    from wb.models.employee import Employee


__all__ = ('EmployeeSchedule',)


class EmployeeSchedule(BaseDBModel):
    __tablename__ = 'employee__schedule'

    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id',
            ondelete='CASCADE',
            name='employee__schedule_employee_id_fkey',
        ),
        primary_key=True,
    )
    employee: Mapped['Employee'] = relationship(
        foreign_keys=[employee_id], lazy='selectin'
    )
    holiday_set_id: Mapped[Optional[int]] = mapped_column(
        sa.ForeignKey('holiday_sets.id', name='employee__schedule_holiday_set_id_fkey')
    )
    holiday_set: Mapped['HolidaySet'] = relationship(
        foreign_keys=[holiday_set_id], lazy='selectin'
    )
    dow: Mapped[int] = mapped_column(
        nullable=False, default=DEFAULT_SCHEDULE_DAYS_OF_WEEK_BITS
    )
    start: Mapped[date] = mapped_column(nullable=False, primary_key=True)
    end: Mapped[Optional[date]] = mapped_column()
    vacation_days_per_year: Mapped[int] = mapped_column(
        default=DEFAULT_VACATION_DAYS_PER_YEAR
    )
    individual_working_hours: Mapped[int | None] = mapped_column(nullable=True)

    __table_args__ = (
        sa.UniqueConstraint(
            'employee_id', 'end', name='uc__employee__schedule__employee_id__end'
        ),
    )

    def get_dow_status(self, dow: int) -> DayType:
        if self.dow & (1 << (6 - dow)):
            return DayType.WORKING_DAY
        return DayType.WEEKEND
