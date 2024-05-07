from datetime import datetime
from typing import Optional

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from ._base import BaseDBModel

__all__ = ('CooperationType',)


class CooperationType(BaseDBModel):
    __tablename__ = 'cooperation_types'

    id: Mapped[int] = mapped_column(primary_key=True)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    revision: Mapped[int] = mapped_column(nullable=False, default=0)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    description: Mapped[Optional[str]]
    is_archived: Mapped[bool] = mapped_column(server_default=expression.false())

    def up_revision(self) -> None:
        self.updated = datetime.utcnow()
        self.revision += 1
