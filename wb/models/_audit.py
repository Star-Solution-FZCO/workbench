from datetime import datetime
from typing import Any

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from ._base import BaseDBModel
from .employee import Employee

__all__ = ('AuditEntry',)

ACTIONS = (
    'INSERT',
    'UPDATE',
    'DELETE',
)


class AuditEntry(BaseDBModel):
    __tablename__ = 'audits'

    id: Mapped[int] = mapped_column(primary_key=True)
    object_id: Mapped[int] = mapped_column(nullable=False, index=True)
    table_name: Mapped[str] = mapped_column(nullable=False, index=True)
    class_name: Mapped[str] = mapped_column(nullable=False, index=True)
    time: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    user_id: Mapped[int] = mapped_column(
        sa.ForeignKey('employees.id', name='audits_user_id_fkey'), nullable=False
    )
    user: Mapped['Employee'] = relationship(foreign_keys=[user_id], lazy='selectin')
    fields = sa.Column(sa.ARRAY(sa.String(255)), nullable=False)  # type: ignore
    action: Mapped[str] = mapped_column(nullable=False)
    data = sa.Column(sa.LargeBinary, nullable=False)

    @validates('action')
    # pylint: disable-next=unused-argument
    def _validate_action(self, key: Any, action: str) -> str:
        if action not in ACTIONS:
            raise ValueError(f'Invalid action: {action}')
        return action
