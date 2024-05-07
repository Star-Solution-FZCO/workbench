import typing as t
from datetime import date, datetime

from pydantic import BaseModel

from wb.schemas import BaseOutModel

if t.TYPE_CHECKING:
    import wb.models as m


class ChangelogOut(BaseOutModel['m.Changelog']):
    id: int
    name: str
    content: str
    created: datetime
    updated: datetime
    release_date: date | None


class ChangelogNameOut(BaseOutModel['m.Changelog']):
    id: int
    name: str


class ChangelogCreate(BaseModel):
    name: str
    content: str
    release_date: date | None = None


class ChangelogUpdate(BaseModel):
    name: str | None = None
    content: str | None = None
    release_date: date | None = None
