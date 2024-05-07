from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from .._base import BaseDBModel

__all__ = ('Portal', 'PortalGroup')


class Portal(BaseDBModel):
    __tablename__ = 'help_center_portals'

    id: Mapped[int] = mapped_column(primary_key=True)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    revision: Mapped[int] = mapped_column(nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(server_default=expression.true())
    name: Mapped[str] = mapped_column(unique=True)
    description: Mapped[str]
    confluence_space_keys: Mapped[str]
    youtrack_project: Mapped[str]

    def up_revision(self) -> None:
        self.updated = datetime.utcnow()
        self.revision += 1


class PortalGroup(BaseDBModel):
    __tablename__ = 'help_center_portal_groups'

    id: Mapped[int] = mapped_column(primary_key=True)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    revision: Mapped[int] = mapped_column(nullable=False, default=0)
    name: Mapped[str]
    portal_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'help_center_portals.id', name='help_center_portal_groups_portal_id_fkey'
        )
    )
    portal: Mapped['Portal'] = relationship(foreign_keys=[portal_id], lazy='selectin')
    is_active: Mapped[bool] = mapped_column(default=True)

    def up_revision(self) -> None:
        self.updated = datetime.utcnow()
        self.revision += 1
