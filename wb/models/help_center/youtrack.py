from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared_utils.sql import EncryptedObject
from wb.config import CONFIG
from wb.models.employee import Employee

from .._base import BaseDBModel

__all__ = ('YoutrackAccessToken', 'YoutrackAccount')


class YoutrackAccessToken(BaseDBModel):
    __tablename__ = 'youtrack_access_tokens'

    id: Mapped[int] = mapped_column(primary_key=True)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    name: Mapped[str]
    token: Mapped[str] = mapped_column(
        EncryptedObject['str'](str, passphrase=CONFIG.DB_ENCRYPT_KEY)
    )


class YoutrackAccount(BaseDBModel):
    __tablename__ = 'youtrack_accounts'

    id: Mapped[int] = mapped_column(primary_key=True)
    youtrack_id: Mapped[str] = mapped_column(unique=True)
    login: Mapped[str | None]
    token_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey(
            'youtrack_access_tokens.id', name='youtrack_accounts_token_id_fkey'
        )
    )
    token: Mapped[YoutrackAccessToken | None] = relationship(
        foreign_keys=[token_id], lazy='selectin'
    )
    banned: Mapped[bool] = mapped_column(default=False)
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id',
            ondelete='CASCADE',
            name='youtrack_accounts_employee_id_fkey',
        )
    )
    employee: Mapped['Employee'] = relationship(
        foreign_keys=[employee_id], lazy='selectin'
    )
