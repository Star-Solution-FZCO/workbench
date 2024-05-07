import hashlib
from datetime import date, datetime
from typing import List

import sqlalchemy as sa
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, mapped_column, relationship

from timetracking.db import TMBaseDBModel

__all__ = ('User',)


class AscUserChat(TMBaseDBModel):
    __tablename__ = 'notification_chats'
    userID: Mapped[int] = mapped_column(
        sa.ForeignKey('users.userID', name='fk_user_project_uid'), primary_key=True
    )
    chatID: Mapped[int] = mapped_column(nullable=False, primary_key=True)

    __table_args__ = (sa.UniqueConstraint('userID', 'chatID', name='uc_user_chat'),)

    # pylint: disable-next=super-init-not-called
    def __init__(self, chat_id: int) -> None:
        # pylint: disable-next=invalid-name
        self.chatID = chat_id  # type: ignore


class User(TMBaseDBModel):
    __tablename__ = 'users'
    userID: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str]
    password: Mapped[str]
    uc_id: Mapped[int | None]
    full_name: Mapped[str]
    login: Mapped[str]
    pararam_id: Mapped[str | None]
    position: Mapped[str | None]
    teamID: Mapped[int | None]
    timezone: Mapped[str | None]
    work_started: Mapped[date | None]
    isHidden: Mapped[str] = mapped_column(
        sa.Enum('Y', 'N'), nullable=False, default='N'
    )
    _notification_chats: Mapped[List[AscUserChat]] = relationship(
        cascade='all, delete-orphan', lazy='selectin'
    )
    notification_chats: AssociationProxy[List[int]] = association_proxy(
        '_notification_chats', 'chatID'
    )
    grpID: Mapped[int] = mapped_column(default=5)
    lastLogin: Mapped[datetime | None]

    def set_tm_key(self, key: str) -> None:
        self.password = hashlib.md5(key.encode()).hexdigest()  # type: ignore
