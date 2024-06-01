from datetime import datetime
from typing import TYPE_CHECKING, Any

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql.json import JSONB
from sqlalchemy.orm import Mapped, declared_attr, mapped_column, relationship

from wb.db import BaseMonthPartitionedModel, BaseMonthPartitionMixin

if TYPE_CHECKING:
    from wb.models.employee import Employee

    from .source import ActivitySource

__all__ = ('DoneTask',)


class DoneTaskMixin:
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id', ondelete='CASCADE', name='done_tasks_employee_id_fkey'
        ),
    )

    source_id: Mapped[int] = mapped_column(
        sa.ForeignKey('activity_sources.id', name='done_tasks_source_id_fkey'),
        primary_key=True,
    )
    task_id: Mapped[str] = mapped_column(primary_key=True)
    task_type: Mapped[str] = mapped_column(primary_key=True)
    time: Mapped[datetime] = mapped_column(primary_key=True)
    task_name: Mapped[str | None]
    task_link: Mapped[str | None]
    meta: Mapped[dict[str, Any]] = mapped_column(
        JSONB(none_as_null=True), server_default=sa.text("'{}'::jsonb")
    )


class DoneTaskPartMixin(DoneTaskMixin, BaseMonthPartitionMixin):
    pass


class DoneTask(DoneTaskMixin, BaseMonthPartitionedModel):
    __tablename__ = 'done_tasks'
    __part_mixin__ = DoneTaskPartMixin
    __partitions__ = {}
    __table_args__ = {
        'postgresql_partition_by': 'RANGE(time)',
    }
    __parts_table_args__ = (sa.UniqueConstraint('source_id', 'task_id', 'task_type'),)

    @declared_attr
    def source(self) -> Mapped['ActivitySource']:
        return relationship('ActivitySource', lazy='selectin')

    @declared_attr
    def employee(self) -> Mapped['Employee']:
        return relationship('Employee', lazy='selectin')

    def to_insert_values(self) -> dict[str, Any]:
        res = {field: getattr(self, field) for field in self.__table__.columns.keys()}
        if res['meta'] is None:
            res.pop('meta')
        return res
