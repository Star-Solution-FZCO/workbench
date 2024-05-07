from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from .._base import BaseDBModel

__all__ = ('HelpCenterAttachment',)


class HelpCenterAttachment(BaseDBModel):
    __tablename__ = 'help_center_attachments'

    id: Mapped[int] = mapped_column(primary_key=True)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    url: Mapped[str]
    type: Mapped[str]
