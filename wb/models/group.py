import typing as t

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ._base import BaseDBModel
from .employee import Employee

__all__ = ('Group',)


association_table_group_members = sa.Table(
    'asc__group__members',
    BaseDBModel.metadata,
    sa.Column(
        'group_id',
        sa.ForeignKey('groups.id', name='asc__group__members_group_id_fkey'),
        primary_key=True,
    ),
    sa.Column(
        'member_id',
        sa.ForeignKey(
            'employees.id',
            ondelete='CASCADE',
            name='asc__group__members_member_id_fkey',
        ),
        primary_key=True,
    ),
)


class Group(BaseDBModel):
    __tablename__ = 'groups'

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey('employees.id', name='group__owner_id_fkey', ondelete='CASCADE'),
        nullable=True,
    )
    name: Mapped[str]
    members: Mapped[t.List['Employee']] = relationship(
        secondary=association_table_group_members,
    )

    __table_args__ = (
        sa.UniqueConstraint('owner_id', 'name', name='uc__group__owner_id__name'),
    )
