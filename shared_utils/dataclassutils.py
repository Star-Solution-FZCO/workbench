import typing as t
from dataclasses import fields, is_dataclass
from datetime import timedelta

__all__ = ('sum_dataclasses',)


def _get_zero_val(obj_type: t.Type) -> t.Any:
    if obj_type == timedelta:
        return timedelta(0)
    if obj_type in (int, float):
        return 0
    raise TypeError('incorrect type for sum')


DataClassT = t.TypeVar('DataClassT')


def sum_dataclasses(
    cls: t.Type[DataClassT], terms: t.Iterable[DataClassT]
) -> DataClassT:
    """
    Sums the values of corresponding fields in a collection of dataclasses.

    Args:
        cls (Type[DataClassT]): The dataclass type.
        terms (Iterable[DataClassT]): The collection of dataclasses to be summed.

    Returns:
        DataClassT: The resulting dataclass with summed field values.

    Raises:
        TypeError: If the input class is not a dataclass.
        ValueError: If any of the terms in the collection is not of the same class as cls.

    Examples:
        >>> from dataclasses import dataclass
        >>> @dataclass
        ... class Point:
        ...     x: int
        ...     y: int
        ...
        >>> p1 = Point(1, 2)
        >>> p2 = Point(3, 4)
        >>> p3 = Point(5, 6)
        >>> sum_dataclasses(Point, [p1, p2, p3])
        Point(x=9, y=12)
    """
    if not is_dataclass(cls):
        raise TypeError(f'{cls} is not dataclass')
    result = cls(**{field.name: _get_zero_val(field.type) for field in fields(cls)})
    for term in terms:
        if not isinstance(term, cls):
            raise ValueError(f'{term} is not {cls}')
        for field in fields(cls):
            setattr(
                result,
                field.name,
                getattr(result, field.name) + getattr(term, field.name),
            )
    return t.cast(DataClassT, result)
