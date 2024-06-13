import typing as t

from pydantic import BaseModel

import wb.models as m
from wb.schemas import BaseOutModel, SelectEmployeeField
from wb.utils.current_user import current_user


class GroupOut(BaseOutModel['m.Group']):
    id: int
    name: str
    members: list[SelectEmployeeField]
    public: bool
    editable: bool

    @classmethod
    def from_obj(cls, obj: 'm.Group') -> t.Self:
        curr_user = current_user()
        return cls(
            id=obj.id,
            name=obj.name,
            members=[SelectEmployeeField.from_obj(emp) for emp in obj.members],
            public=obj.owner_id is None,
            editable=curr_user.is_admin
            and obj.owner_id is None
            or (isinstance(curr_user, m.Employee) and obj.owner_id == curr_user.id),
        )


class GroupListItemOut(BaseOutModel['m.Group']):
    id: int
    name: str
    public: bool
    editable: bool

    @classmethod
    def from_obj(cls, obj: 'm.Group') -> t.Self:
        curr_user = current_user()
        return cls(
            id=obj.id,
            name=obj.name,
            public=obj.owner_id is None,
            editable=curr_user.is_admin
            and obj.owner_id is None
            or (isinstance(curr_user, m.Employee) and obj.owner_id == curr_user.id),
        )


class GroupCreate(BaseModel):
    name: str
    members: list[SelectEmployeeField]
    public: bool


class GroupUpdate(BaseModel):
    name: str | None = None
    members: list[SelectEmployeeField] | None = None
    public: bool | None = None
