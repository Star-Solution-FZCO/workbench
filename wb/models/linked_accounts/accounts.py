from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from wb.db import BaseDBModel

from .source import LinkedAccountSource

if TYPE_CHECKING:
    from wb.models.employee import Employee

__all__ = ('LinkedAccount',)


class LinkedAccount(BaseDBModel):
    __tablename__ = 'linked_accounts'
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id', ondelete='CASCADE', name='linked_accounts_employee_id_fkey'
        ),
        primary_key=True,
    )
    employee: Mapped['Employee'] = relationship(
        'Employee', foreign_keys=[employee_id], back_populates='linked_accounts'
    )

    source_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'linked_account_sources.id',
            ondelete='CASCADE',
            name='linked_accounts_source_id_fkey',
        ),
        primary_key=True,
    )
    source: Mapped['LinkedAccountSource'] = relationship(
        'LinkedAccountSource', foreign_keys=[source_id], lazy='joined'
    )

    account_id: Mapped[str]
    active: Mapped[bool | None]
