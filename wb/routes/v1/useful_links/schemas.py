import typing as t

from pydantic import BaseModel

from wb.schemas import BaseOutModel

if t.TYPE_CHECKING:
    import wb.models as m


__all__ = (
    'UsefulLinkOut',
    'UsefulLinkCreate',
    'UsefulLinkUpdate',
)


class UsefulLinkOut(BaseOutModel['m.UsefulLink']):
    id: int
    name: str
    link: str
    description: str | None


class UsefulLinkCreate(BaseModel):
    name: str
    link: str
    description: str | None


class UsefulLinkUpdate(BaseModel):
    name: str | None
    link: str | None
    description: str | None
