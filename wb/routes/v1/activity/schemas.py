import typing as t
from datetime import datetime

from pydantic import BaseModel

from wb.schemas import BaseOutModel, SelectField

if t.TYPE_CHECKING:
    import wb.models as m

__all__ = ('ActivitySourceOut', 'ActivitySourceCreate', 'ActivitySourceUpdate')


class ActivitySourceOut(BaseOutModel['m.ActivitySource']):
    id: int
    type: SelectField
    name: str
    description: str | None
    active: bool
    activity_collected: datetime
    private: bool

    @classmethod
    def from_obj(cls, obj: 'm.ActivitySource') -> t.Self:
        return cls(
            id=obj.id,
            type=SelectField(label=obj.type, value=obj.type),
            name=obj.name,
            description=obj.description,
            active=obj.active,
            activity_collected=obj.activity_collected,
            private=obj.private,
        )


class ActivitySourceCreate(BaseModel):
    type: SelectField
    name: str
    description: str | None = None
    active: bool = True
    config: t.Any
    private: bool = False


class ActivitySourceUpdate(BaseModel):
    type: SelectField | None = None
    name: str | None = None
    description: str | None = None
    active: bool | None = None
    config: t.Any | None = None
    private: bool | None = None
