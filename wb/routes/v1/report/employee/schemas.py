import typing as t
from datetime import datetime

from pydantic import BaseModel

from wb.schemas import BaseOutModel

if t.TYPE_CHECKING:
    import wb.models as m


__all__ = (
    'IssuesSettingsOut',
    'IssuesSettingsUpdate',
)


class IssuesSettingsOut(BaseOutModel['m.IssueSettings']):
    projects: list[str]
    created: datetime
    updated: datetime


class IssuesSettingsUpdate(BaseModel):
    projects: list[str] | None = None
