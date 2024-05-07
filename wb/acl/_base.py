from collections.abc import Callable
from dataclasses import dataclass
from typing import Generic, TypeVar

__all__ = (
    'FieldACL',
    'list_model_readable_fields',
)

ModelT = TypeVar('ModelT')


@dataclass
class FieldACL(Generic[ModelT]):
    edit: frozenset[str] | Callable[[ModelT | None], frozenset[str]]
    view: frozenset[str] | Callable[[ModelT | None], frozenset[str]]

    def can_edit(
        self,
        roles: set[str] | Callable[[ModelT | None], set[str]],
        obj: ModelT | None = None,
    ) -> bool:
        if callable(self.edit):
            editors = self.edit(obj)
        else:
            editors = self.edit
        if 'all' in editors:
            return True
        if callable(roles):
            roles = roles(obj)
        return bool(roles.intersection(editors))

    def can_view(
        self,
        roles: set[str] | Callable[[ModelT | None], set[str]],
        obj: ModelT | None = None,
    ) -> bool:
        if callable(self.view):
            viewers = self.view(obj)
        else:
            viewers = self.view
        if 'all' in viewers:
            return True
        if callable(roles):
            roles = roles(obj)
        return bool(roles.intersection(viewers))


def list_model_readable_fields(
    acls: dict[str, FieldACL[ModelT]],
    obj: ModelT | None = None,
    related_roles_getter: Callable[[ModelT | None], set[str]] | None = None,
) -> list[str]:
    return [
        field
        for field, acl in acls.items()
        if acl.can_view(related_roles_getter or set[str](), obj)
    ]
