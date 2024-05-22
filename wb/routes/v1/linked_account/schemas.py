from typing import TYPE_CHECKING, Any, Self

from pydantic import BaseModel

from wb.schemas import SelectField

if TYPE_CHECKING:
    import wb.models as m

__all__ = (
    'LinkedAccountSourceOut',
    'LinkedAccountSourceCreate',
    'LinkedAccountSourceUpdate',
)


class LinkedAccountSourceOut(BaseModel):
    id: int
    type: SelectField
    name: str
    description: str | None
    active: bool
    public: bool

    @classmethod
    def from_obj(cls, obj: 'm.LinkedAccountSource') -> Self:
        return cls(
            id=obj.id,
            type=SelectField(label=obj.type, value=obj.type),
            name=obj.name,
            description=obj.description,
            active=obj.active,
            public=obj.public,
        )


class LinkedAccountSourceCreate(BaseModel):
    type: SelectField
    name: str
    config: Any
    description: str | None = None
    active: bool = True
    public: bool = False


class LinkedAccountSourceUpdate(BaseModel):
    type: SelectField = None
    name: str = None
    config: Any = None
    description: str | None = None
    active: bool = None
    public: bool = None
