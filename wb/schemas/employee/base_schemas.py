import typing as t

from pydantic import BaseModel

from wb.schemas._base import SelectFieldInt

if t.TYPE_CHECKING:
    import wb.models as m


__all__ = (
    'SelectEmployeeField',
    'ShortEmployeeOut',
)


class SelectEmployeeField(SelectFieldInt):
    email: str | None = None
    pararam: str | None = None

    # pylint: disable=unused-argument
    @classmethod
    def from_obj(  # type: ignore[override]
        cls, obj: 'm.Employee', label: str = 'english_name', value: str = 'id'
    ) -> t.Self:
        return cls(
            value=obj.id,
            label=obj.english_name,
            email=obj.email,
            pararam=obj.pararam,
        )


class ShortEmployeeOut(BaseModel):
    id: int
    english_name: str
    pararam: str | None

    @classmethod
    def from_obj(cls, user: 'm.Employee') -> t.Self:
        return cls(
            id=user.id,
            english_name=user.english_name,
            pararam=user.pararam,
        )
