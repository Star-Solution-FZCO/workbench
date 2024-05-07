from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from ._base import BaseDBModel

__all__ = ('EmployeePool',)


class EmployeePool(BaseDBModel):
    __tablename__ = 'employee_pools'

    id: Mapped[int] = mapped_column(primary_key=True)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    revision: Mapped[int] = mapped_column(nullable=False, default=0)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)

    def up_revision(self) -> None:
        self.updated = datetime.utcnow()
        self.revision += 1
