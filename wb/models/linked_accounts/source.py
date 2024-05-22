from enum import StrEnum
from typing import Any

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from shared_utils.sql import EncryptedObject, StringEnum
from wb.config import CONFIG
from wb.db import BaseDBModel

__all__ = (
    'LinkedAccountSource',
    'LinkedAccountSourceType',
)


class LinkedAccountSourceType(StrEnum):
    RESTAPI = 'restapi'


class LinkedAccountSource(BaseDBModel):
    __tablename__ = 'linked_account_sources'
    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[LinkedAccountSourceType] = mapped_column(
        StringEnum['LinkedAccountSourceType'](LinkedAccountSourceType, 32)
    )
    name: Mapped[str] = mapped_column(unique=True)
    description: Mapped[str | None]
    config: Mapped[Any | None] = mapped_column(
        EncryptedObject['Any'](object, passphrase=CONFIG.DB_ENCRYPT_KEY)
    )
    active: Mapped[bool] = mapped_column(server_default=expression.true())
    public: Mapped[bool] = mapped_column(server_default=expression.true())
