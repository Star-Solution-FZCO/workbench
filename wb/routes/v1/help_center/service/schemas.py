import json
import typing as t
from datetime import datetime

from pydantic import BaseModel

from wb.routes.v1.help_center.portal.schemas import PortalGroupOut
from wb.schemas import BaseOutModel

if t.TYPE_CHECKING:
    import wb.models as m


class ServiceOut(BaseOutModel['m.Service']):
    id: int
    name: str
    description: str
    short_description: str
    icon: str
    group: PortalGroupOut
    user_fields: list[dict[str, t.Any]]
    predefined_custom_fields: list[dict[str, t.Any]]
    tags: str | None
    created: datetime
    updated: datetime
    is_active: bool

    @classmethod
    def from_obj(cls, obj: 'm.Service') -> t.Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            short_description=obj.short_description,
            icon=obj.icon,
            group=PortalGroupOut.from_obj(obj.group),
            user_fields=json.loads(obj.user_fields),
            predefined_custom_fields=json.loads(obj.predefined_custom_fields),
            tags=obj.tags,
            created=obj.created,
            updated=obj.updated,
            is_active=obj.is_active,
        )


class ServiceCreate(BaseModel):
    name: str
    description: str
    short_description: str
    portal_group_id: int
    icon: str
    user_fields: list[dict[str, t.Any]]
    predefined_custom_fields: list[dict[str, t.Any]]
    tags: str | None = None


class ServiceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    short_description: str | None = None
    icon: str | None = None
    user_fields: list[dict[str, t.Any]] | None = None
    predefined_custom_fields: list[dict[str, t.Any]] | None = None
    portal_group_id: int | None = None
    tags: str | None = None
    is_active: bool | None = None
