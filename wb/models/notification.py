from datetime import datetime
from typing import cast

import sqlalchemy as sa
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from ._base import BaseDBModel

__all__ = ('Notification',)


class Notification(BaseDBModel):
    __tablename__ = 'notifications'

    id: Mapped[int] = mapped_column(primary_key=True)
    subject: Mapped[str]
    content: Mapped[str]
    type: Mapped[str]
    recipient_id: Mapped[int] = mapped_column(
        ForeignKey(
            'employees.id', ondelete='CASCADE', name='notifications_recipient_id_fkey'
        )
    )
    recipient: Mapped['Employee'] = relationship(
        foreign_keys=[recipient_id], lazy='selectin'
    )
    read: Mapped[datetime | None]
    show_on_main_page: Mapped[bool] = mapped_column(server_default=expression.false())
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )

    def __str__(self) -> str:
        return cast(str, self.content)

    def is_read(self) -> bool:
        return bool(self.read)
