import base64
import binascii
import secrets
import typing as t
from datetime import datetime, timedelta

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared_utils.sql import EncryptedObject
from wb.config import CONFIG
from wb.db import BaseDBModel

if t.TYPE_CHECKING:
    from .employee import Employee

__all__ = ('APIToken', 'APITokenParseException')

ALT_CHARS = b'-:'


class APITokenParseException(Exception):
    msg = 'failed to parse token'


class APIToken(BaseDBModel):
    __tablename__ = 'api_tokens'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    owner_id: Mapped[int] = mapped_column(
        sa.ForeignKey('employees.id', name='api_tokens_owner_id_fkey')
    )
    owner: Mapped['Employee'] = relationship(foreign_keys=[owner_id])
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    expires_in: Mapped[int | None]
    token: Mapped[str] = mapped_column(
        EncryptedObject['str'](str, passphrase=CONFIG.DB_ENCRYPT_KEY)
    )

    @property
    def is_expired(self) -> bool:
        if not self.expires_in:
            return False
        # noinspection PyTypeChecker
        return bool(
            self.created + timedelta(seconds=self.expires_in) < datetime.utcnow()
        )

    @staticmethod
    def _gen_token(owner_id: int) -> str:
        return base64.b64encode(
            f'{owner_id}:{secrets.token_hex(32)}:{datetime.now().timestamp()}'.encode(),
            altchars=ALT_CHARS,
        ).decode()

    @staticmethod
    def get_owner_id_from_token(token: str) -> int:
        try:
            return int(
                base64.b64decode(token.encode(), altchars=ALT_CHARS)
                .decode()
                .split(':', maxsplit=1)[0]
            )
        except (binascii.Error, ValueError) as err:
            raise APITokenParseException() from err

    @classmethod
    def create(
        cls,
        name: str,
        owner: 'Employee',
        created: datetime,
        expires_in: int | None = None,
    ) -> t.Self:
        return cls(
            name=name,
            owner_id=owner.id,
            created=created,
            expires_in=expires_in,
            token=cls._gen_token(owner.id),
        )
