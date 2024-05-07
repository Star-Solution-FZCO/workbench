from datetime import datetime
from enum import StrEnum

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from shared_utils.sql import EncryptedObject, StringEnum
from wb.config import CONFIG
from wb.db import BaseDBModel

__all__ = (
    'OAuthClient',
    'OAuthResponseType',
    'OAuthGrantType',
)


class OAuthGrantType(StrEnum):
    AUTHORIZATION_CODE = 'authorization_code'


class OAuthResponseType(StrEnum):
    CODE = 'code'
    ID_TOKEN = 'id_token'  # nosec hardcoded_password_string


class OAuthClient(BaseDBModel):
    __tablename__ = 'oauth_clients'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    client_id: Mapped[str] = mapped_column(unique=True)
    client_secret: Mapped[str] = mapped_column(
        EncryptedObject['str'](str, passphrase=CONFIG.DB_ENCRYPT_KEY)
    )
    grant_types: Mapped[list[OAuthGrantType]] = mapped_column(
        sa.ARRAY(StringEnum['OAuthGrantType'](OAuthGrantType, 32)), nullable=False
    )
    response_types: Mapped[list[OAuthResponseType]] = mapped_column(
        sa.ARRAY(StringEnum['OAuthResponseType'](OAuthResponseType, 32)), nullable=False
    )
    redirect_uris: Mapped[list[str]] = mapped_column(
        sa.ARRAY(sa.String()), nullable=False
    )
    scope: Mapped[str]
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    created_by_id: Mapped[int] = mapped_column(
        sa.ForeignKey('employees.id', name='oauth_clients_created_by_id_fkey')
    )
    active: Mapped[bool] = mapped_column(server_default=expression.true())
