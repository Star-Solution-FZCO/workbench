from datetime import datetime
from typing import Any

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql.json import JSONB
from sqlalchemy.orm import Mapped, declared_attr, mapped_column, relationship

from wb.db import BaseMonthPartitionedModel, BaseMonthPartitionMixin

from ..employee import Employee
from .source import ActivitySource

__all__ = ('Activity',)


class ActivityMixin:
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id', ondelete='CASCADE', name='activities_employee_id_fkey'
        ),
        primary_key=True,
    )
    source_id: Mapped[int] = mapped_column(
        sa.ForeignKey('activity_sources.id', name='activities_source_id_fkey'),
        primary_key=True,
    )
    action: Mapped[str] = mapped_column(primary_key=True)
    time: Mapped[datetime] = mapped_column(primary_key=True)
    target_id: Mapped[str] = mapped_column(primary_key=True)
    target_name: Mapped[str | None]
    target_link: Mapped[str | None]
    duration: Mapped[int] = mapped_column(default=0)
    meta: Mapped[dict[str, Any]] = mapped_column(
        JSONB(none_as_null=True), server_default=sa.text("'{}'::jsonb")
    )


class ActivityPartMixin(ActivityMixin, BaseMonthPartitionMixin):
    pass


class Activity(ActivityMixin, BaseMonthPartitionedModel):
    __tablename__ = 'activities'
    __part_mixin__ = ActivityPartMixin
    __partitions__ = {}
    __table_args__ = {
        'postgresql_partition_by': 'RANGE(time)',
    }

    @declared_attr
    def source(self) -> Mapped[ActivitySource]:
        return relationship('ActivitySource', lazy='selectin')

    @declared_attr
    def employee(self) -> Mapped[Employee]:
        return relationship('Employee', lazy='selectin')

    def to_insert_values(self) -> dict[str, Any]:
        res = {field: getattr(self, field) for field in self.__table__.columns.keys()}
        if res['duration'] is None:
            res.pop('duration')
        if res['meta'] is None:
            res.pop('meta')
        return res
