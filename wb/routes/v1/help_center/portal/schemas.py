import typing as t
from datetime import datetime

from pydantic import BaseModel

from wb.schemas import BaseOutModel

if t.TYPE_CHECKING:
    import wb.models as m


class PortalOut(BaseOutModel['m.Portal']):
    id: int
    name: str
    description: str
    confluence_space_keys: str
    youtrack_project: str
    created: datetime
    updated: datetime
    is_active: bool


class PortalCreate(BaseModel):
    name: str
    description: str
    confluence_space_keys: str
    youtrack_project: str


class PortalUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    confluence_space_keys: str | None = None
    youtrack_project: str | None = None
    is_active: bool | None = None


class PortalGroupOut(BaseOutModel['m.PortalGroup']):
    id: int
    name: str
    portal: PortalOut
    created: datetime
    updated: datetime
    is_active: bool

    @classmethod
    def from_obj(cls, obj: 'm.PortalGroup') -> t.Self:
        data = {
            'id': obj.id,
            'name': obj.name,
            'created': obj.created,
            'updated': obj.updated,
            'is_active': obj.is_active,
            'portal': PortalOut.from_obj(obj.portal),
        }
        return cls(**data)  # type: ignore


class PortalGroupCreate(BaseModel):
    name: str
    portal_id: int


class PortalGroupUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None
