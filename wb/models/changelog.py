from __future__ import annotations

from datetime import date, datetime
from typing import Optional

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from ._base import BaseDBModel

__all__ = ('Changelog',)


class Changelog(BaseDBModel):
    __tablename__ = 'changelogs'

    id: Mapped[int] = mapped_column(primary_key=True)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    name: Mapped[str] = mapped_column(unique=True)
    content: Mapped[Optional[str]]
    release_date: Mapped[date | None]
