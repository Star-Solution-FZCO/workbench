from __future__ import annotations

from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql.json import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ._base import BaseDBModel

__all__ = ('Issue', 'IssuesSettings')


class Issue(BaseDBModel):
    __tablename__ = 'issues'

    id: Mapped[int] = mapped_column(primary_key=True)
    issue_id: Mapped[str]
    subject: Mapped[str]
    assignee_id: Mapped[int] = mapped_column(
        sa.ForeignKey('employees.id', name='issues_assignee_id_fkey')
    )
    assignee: Mapped['Employee'] = relationship(
        'Employee', foreign_keys=[assignee_id], lazy='selectin'
    )
    severity: Mapped[str | None] = mapped_column(nullable=True)
    priority: Mapped[str | None] = mapped_column(nullable=True)
    sprints: Mapped[list[str]] = mapped_column(
        JSONB(none_as_null=True), server_default=sa.text("'[]'::jsonb")
    )
    resolved: Mapped[bool] = mapped_column(default=False)
    unplanned: Mapped[bool] = mapped_column(default=False)
    due_date: Mapped[datetime]
    created: Mapped[datetime]


class IssuesSettings(BaseDBModel):
    __tablename__ = 'issues_settings'

    id: Mapped[int] = mapped_column(primary_key=True)
    projects: Mapped[list[str]] = mapped_column(
        JSONB(none_as_null=True), server_default=sa.text("'[]'::jsonb")
    )
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now(),  # pylint: disable=not-callable
    )
