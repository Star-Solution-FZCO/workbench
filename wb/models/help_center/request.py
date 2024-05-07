from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from wb.models.employee import Employee

from .._base import BaseDBModel
from .service import Service

__all__ = ('HelpCenterRequest',)


class HelpCenterRequest(BaseDBModel):
    __tablename__ = 'help_center_requests'

    id: Mapped[int] = mapped_column(primary_key=True)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    is_active: Mapped[bool] = mapped_column(default=True)
    service_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'help_center_services.id', name='help_center_requests_service_id_fkey'
        )
    )
    service: Mapped['Service'] = relationship(
        foreign_keys=[service_id], lazy='selectin'
    )
    created_by_id: Mapped[int] = mapped_column(
        sa.ForeignKey('employees.id', name='help_center_requests_created_by_id_fkey')
    )
    created_by: Mapped['Employee'] = relationship(
        foreign_keys=[created_by_id], lazy='selectin'
    )
    issue_id: Mapped[str]
