from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import (
    Mapped,
    declarative_mixin,
    declared_attr,
    mapped_column,
    relationship,
)

from .._base import BaseDBModel

__all__ = ('Request',)


@declarative_mixin
class RequestMixin:
    @declared_attr
    def created_by_id(cls):  # pylint: disable=no-self-argument
        return sa.Column('created_by_id', sa.ForeignKey('employees.id'), nullable=False)

    @declared_attr
    def created_by(cls):  # pylint: disable=no-self-argument
        return relationship(
            'Employee', foreign_keys=[cls.created_by_id], lazy='selectin'
        )


class Request(RequestMixin, BaseDBModel):
    __abstract__ = True
    __request_type__: str = ''

    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )

    status: Mapped[str] = mapped_column(nullable=False)

    @property
    def type(self) -> str:
        return self.__request_type__
