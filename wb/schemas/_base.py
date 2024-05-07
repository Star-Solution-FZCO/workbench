import typing as t
from abc import ABC
from dataclasses import dataclass
from types import UnionType

from pydantic import BaseModel, GetJsonSchemaHandler, create_model
from pydantic_core import CoreSchema

__all__ = (
    'BaseOutModel',
    'JSONObjectAnnotation',
    'GenericSelectField',
    'SelectField',
    'SelectFieldInt',
    'ModelFieldAnnotation',
    'ModelOutPrototype',
)


T = t.TypeVar('T')


class BaseOutModel(BaseModel, ABC, t.Generic[T]):
    @classmethod
    def from_obj(cls, obj: T) -> t.Self:
        return cls(**{field: getattr(obj, field) for field in cls.__fields__})


class GenericSelectField(BaseModel, t.Generic[T]):
    label: str | None
    value: T

    @classmethod
    def from_obj(cls, obj: object, label: str, value: str) -> t.Self:
        return cls(label=str(getattr(obj, label)), value=getattr(obj, value))


SelectField = GenericSelectField[str]
SelectFieldInt = GenericSelectField[int]


class JSONObjectAnnotation(BaseModel):
    @classmethod
    def __get_validators__(cls) -> t.Iterator[t.Callable]:
        yield cls.validate

    @classmethod
    def validate(cls, value: t.Any) -> dict | list:
        if isinstance(value, list):
            return value
        if isinstance(value, dict):
            return value
        raise ValueError('Value should be dict or list')

    @classmethod
    def __modify_schema__(cls, field_schema: dict[str, t.Any]) -> None:
        field_schema.update(description='json object', example='[] or {}')

    @classmethod
    def __get_pydantic_json_schema__(  # pylint: disable=arguments-differ
        cls, core_schema: CoreSchema, handler: GetJsonSchemaHandler
    ) -> dict[str, t.Any]:
        json_schema = super().__get_pydantic_json_schema__(core_schema, handler)
        json_schema = handler.resolve_ref_schema(json_schema)
        json_schema.update(description='json object', example='[] or {}')
        return json_schema


@dataclass
class ModelFieldAnnotation(t.Generic[T]):
    name: str
    type: type | UnionType
    _getter: t.Callable[[T], t.Any] | None = None
    extra: bool = False
    csv_include: bool = False
    _csv_getter: t.Callable[[T], str] | None = None

    @property
    def getter(self) -> t.Callable[..., t.Any]:
        if self.extra:
            return lambda obj, **kwargs: kwargs.get(self.name)
        if self._getter is not None:
            return lambda obj, **kwargs: self._getter(obj)  # type: ignore[misc]
        return lambda obj, **kwargs: getattr(obj, self.name)

    @property
    def csv_getter(self) -> t.Callable[[T], str]:
        if self._csv_getter is not None:
            return self._csv_getter

        def default_getter(obj: T) -> str:
            val = getattr(obj, self.name)
            if val is not None:
                return str(val)
            return ''

        return default_getter  # type: ignore

    def __hash__(self) -> int:
        return hash(self.name)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, self.__class__):
            return False
        return self.name == other.name


class ModelOutPrototype(BaseModel, t.Generic[T]):
    __field_getters__: t.ClassVar[dict[str, t.Callable]] = {}

    @classmethod
    def from_obj(cls, obj: 'T', **kwargs: t.Any) -> t.Self:
        data = {}
        for field in cls.model_fields:  # pylint: disable=not-an-iterable
            getter = cls.__field_getters__.get(
                field,
                lambda o: getattr(o, field),  # pylint: disable=cell-var-from-loop
            )
            data[field] = getter(obj, **kwargs)  # type: ignore
        return cls(**data)

    @classmethod
    def with_fields(
        cls,
        fields_annotations: list[tuple[ModelFieldAnnotation[T], t.Any]],
        model_name: str = 'ModelOut',
    ) -> t.Type[t.Self]:
        model = create_model(
            model_name,
            __base__=cls,
            **{
                fa.name: pydantic_annotation
                for fa, pydantic_annotation in fields_annotations
            },
        )
        model.__field_getters__ = {
            **cls.__field_getters__,
            **{fa.name: fa.getter for fa, _ in fields_annotations},
        }
        return model  # type: ignore
