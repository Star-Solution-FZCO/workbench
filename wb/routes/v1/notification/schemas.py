import typing as t
from datetime import datetime

from pydantic import BaseModel

from wb.schemas import BaseOutModel

if t.TYPE_CHECKING:
    import wb.models as m


class NotificationOut(BaseOutModel['m.Notification']):
    id: int
    subject: str
    content: str
    type: str
    read: datetime | None
    show_on_main_page: bool
    created: datetime


class NotificationCreate(BaseModel):
    recipients: list[int]
    subject: str
    content: str
    type: str
    show_on_main_page: bool


class NotificationUpdate(BaseModel):
    subject: str | None = None
    content: str | None = None
    type: str | None = None
    read: bool | None = None
    show_on_main_page: bool | None = None


class ReadNotifications(BaseModel):
    notifications: list[int]
