from datetime import date, datetime
from typing import List, Optional

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from shared_utils.sql import StringEnum

from .._base import BaseDBModel
from ._base import DAY_TYPE_FIELD_MAX_LENGTH, DayType

__all__ = (
    'HolidaySet',
    'Holiday',
)


class Holiday(BaseDBModel):
    __tablename__ = 'holiday_set__holiday'

    holiday_set_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'holiday_sets.id', name='holiday_set__holiday_holiday_set_id_fkey'
        ),
        primary_key=True,
    )
    name: Mapped[str] = mapped_column(nullable=False)
    day: Mapped[date] = mapped_column(nullable=False, primary_key=True)
    type: Mapped[DayType] = mapped_column(
        StringEnum['DayType'](DayType, DAY_TYPE_FIELD_MAX_LENGTH),
        server_default=DayType.HOLIDAY,
    )

    @property
    def is_working(self) -> bool:
        return bool(self.type == DayType.WORKING_DAY)


class HolidaySet(BaseDBModel):
    __tablename__ = 'holiday_sets'

    id: Mapped[int] = mapped_column(primary_key=True)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    revision: Mapped[int] = mapped_column(nullable=False, default=0)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column()
    holidays: Mapped[List['Holiday']] = relationship(
        cascade='all, delete-orphan', lazy='selectin'
    )
    is_default: Mapped[bool] = mapped_column(server_default=expression.false())

    def up_revision(self) -> None:
        self.updated = datetime.utcnow()
        self.revision += 1
