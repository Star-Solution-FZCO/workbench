from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from wb.models.help_center.portal import PortalGroup

from .._base import BaseDBModel

__all__ = ('Service',)


class Service(BaseDBModel):
    __tablename__ = 'help_center_services'

    id: Mapped[int] = mapped_column(primary_key=True)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)
    revision: Mapped[int] = mapped_column(nullable=False, default=0)
    name: Mapped[str]
    description: Mapped[str]
    short_description: Mapped[str]
    portal_group_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'help_center_portal_groups.id',
            name='help_center_services_portal_group_id_fkey',
        )
    )
    group: Mapped['PortalGroup'] = relationship(
        foreign_keys=[portal_group_id], lazy='selectin'
    )
    icon: Mapped[str | None]
    user_fields: Mapped[str]
    predefined_custom_fields: Mapped[str]
    tags: Mapped[str | None]

    def up_revision(self) -> None:
        self.updated = datetime.utcnow()
        self.revision += 1
