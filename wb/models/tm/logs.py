from datetime import datetime
from enum import StrEnum

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from shared_utils.sql import StringEnum
from wb.db import BaseMonthPartitionedModel, BaseMonthPartitionMixin

__all__ = (
    'TMRecord',
    'TMRecordType',
)


class TMRecordType(StrEnum):
    COME = 'come'
    AWAY = 'away'
    AWAKE = 'awake'
    LEAVE = 'leave'


class TMRecordMixin:
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id', name='tm_records_employee_id_fkey', ondelete='CASCADE'
        ),
        primary_key=True,
    )
    status: Mapped[TMRecordType] = mapped_column(
        StringEnum['TMRecordType'](TMRecordType, 8)
    )
    time: Mapped[datetime] = mapped_column(primary_key=True)
    source: Mapped[str | None]


class TMRecordPartMixin(TMRecordMixin, BaseMonthPartitionMixin):
    pass


class TMRecord(TMRecordMixin, BaseMonthPartitionedModel):
    __tablename__ = 'tm_records'
    __part_mixin__ = TMRecordPartMixin
    __partitions__ = {}
    __table_args__ = {
        'postgresql_partition_by': 'RANGE(time)',
    }
