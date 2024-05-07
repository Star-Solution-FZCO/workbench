from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any, List, Optional

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql.json import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared_utils.sql import StringEnum

from ._base import BaseDBModel

__all__ = (
    'CounterAgent',
    'CounterAgentStatus',
    'CounterAgentCredentials',
    'CounterAgentCredentialsStatus',
)


class CounterAgentStatus(StrEnum):
    VALID = 'VALID'
    INVALID = 'INVALID'
    SUSPENDED = 'SUSPENDED'


class CounterAgent(BaseDBModel):
    __tablename__ = 'counteragents'

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(nullable=False, unique=True)
    username: Mapped[str] = mapped_column(unique=True)
    english_name: Mapped[str] = mapped_column(unique=True)
    contacts: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB(none_as_null=True), server_default=sa.text("'[]'::jsonb")
    )
    group: Mapped[bool] = mapped_column(default=False)
    parent_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey('counteragents.id', name='counteragents_parent_id_fkey'),
        nullable=True,
    )
    parent: Mapped[Optional['CounterAgent']] = relationship(
        'CounterAgent',
        back_populates='agents',
        lazy='selectin',
        remote_side=[id],
    )
    agents: Mapped[List['CounterAgent']] = relationship(
        back_populates='parent', lazy='selectin'
    )
    organization_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey('organizations.id', name='counteragents_organization_id_fkey'),
        nullable=True,
    )
    organization: Mapped[Optional['Organization']] = relationship(
        foreign_keys=[organization_id], lazy='selectin'
    )
    team_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey('teams.id', name='counteragents_team_id_fkey'), nullable=True
    )
    team: Mapped[Optional['Team']] = relationship(
        foreign_keys=[team_id], lazy='selectin'
    )
    team_required: Mapped[bool] = mapped_column(default=True)
    manager_id: Mapped[int] = mapped_column(
        sa.ForeignKey('employees.id', name='counteragents_manager_id_fkey')
    )
    manager: Mapped['Employee'] = relationship(
        foreign_keys=[manager_id], lazy='selectin'
    )
    status: Mapped[CounterAgentStatus] = mapped_column(
        StringEnum['CounterAgentStatus'](CounterAgentStatus, 32),
        server_default=CounterAgentStatus.VALID,
    )
    schedule: Mapped[str] = mapped_column(default='every_month')
    revision: Mapped[int] = mapped_column(nullable=False, default=0)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )

    def up_revision(self) -> None:
        self.updated = datetime.utcnow()
        self.revision += 1


class CounterAgentCredentialsStatus(StrEnum):
    PENDING = 'PENDING'
    UPLOADED = 'UPLOADED'
    COLLECTED = 'COLLECTED'
    ACTIVE = 'ACTIVE'
    INACTIVE = 'INACTIVE'
    EXPIRED = 'EXPIRED'


class CounterAgentCredentials(BaseDBModel):
    __tablename__ = 'counteragents_credentials'

    id: Mapped[int] = mapped_column(primary_key=True)
    counteragent_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'counteragents.id', name='counteragents_credentials_counteragent_id_fkey'
        ),
        nullable=False,
    )
    counteragent: Mapped[CounterAgent] = relationship(
        'CounterAgent', foreign_keys=[counteragent_id], lazy='selectin'
    )
    created_by_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id', name='counteragents_credentials_created_by_id_fkey'
        )
    )
    created_by: Mapped['Employee'] = relationship(
        foreign_keys=[created_by_id], lazy='selectin'
    )
    request_id: Mapped[str | None]
    notifications: Mapped[list[dict[str, str]]] = mapped_column(
        JSONB(none_as_null=True), server_default=sa.text("'[]'::jsonb")
    )
    bundle: Mapped[dict[str, Any]] = mapped_column(JSONB(none_as_null=True))
    status: Mapped[CounterAgentCredentialsStatus] = mapped_column(
        StringEnum['CounterAgentCredentialsStatus'](CounterAgentCredentialsStatus, 32),
        server_default=CounterAgentCredentialsStatus.PENDING,
    )
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
