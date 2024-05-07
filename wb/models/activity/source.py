from datetime import datetime
from enum import StrEnum
from typing import Any

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from shared_utils.sql import EncryptedObject, StringEnum
from wb.config import CONFIG
from wb.db import BaseDBModel

__all__ = (
    'ActivitySource',
    'ActivitySourceType',
)


class ActivitySourceType(StrEnum):
    YOUTRACK = 'youtrack'
    GERRIT = 'gerrit'
    CVS = 'cvs'
    PARARAM = 'pararam'
    ZENDESK = 'zendesk'
    GOOGLE_DRIVE = 'gdrive'
    GOOGLE_MEET = 'gmeet'
    DISCORD = 'discord'


class ActivitySource(BaseDBModel):
    __tablename__ = 'activity_sources'
    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[ActivitySourceType] = mapped_column(
        StringEnum['ActivitySourceType'](ActivitySourceType, 32)
    )
    name: Mapped[str] = mapped_column(unique=True)
    description: Mapped[str | None]
    config: Mapped[Any | None] = mapped_column(
        EncryptedObject['Any'](object, passphrase=CONFIG.DB_ENCRYPT_KEY)
    )
    active: Mapped[bool] = mapped_column(server_default=expression.true())
    activity_collected: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    private: Mapped[bool] = mapped_column(server_default=expression.false())
