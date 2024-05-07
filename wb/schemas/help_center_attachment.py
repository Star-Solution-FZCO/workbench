import typing as t
from datetime import datetime

from pydantic import BaseModel

from ._base import BaseOutModel

if t.TYPE_CHECKING:
    import wb.models as m


__all__ = ('HelpCenterAttachmentOut', 'HelpCenterAttachmentCreate')


class HelpCenterAttachmentOut(BaseOutModel['m.HelpCenterAttachment']):
    id: int
    created: datetime
    url: str
    type: str


class HelpCenterAttachmentCreate(BaseModel):
    url: str
    type: str
