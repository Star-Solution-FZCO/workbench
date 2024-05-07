from typing import Any

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql.json import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .._base import BaseDBModel

__all__ = ('EmployeeRequestSettings',)


class EmployeeRequestSettings(BaseDBModel):
    __tablename__ = 'requests__employee_request_settings'

    id: Mapped[int] = mapped_column(primary_key=True)
    work_start: Mapped[str] = mapped_column(default='09:00')
    work_end: Mapped[str] = mapped_column(default='18:00')
    duration: Mapped[int] = mapped_column(default=1)  # in hours
    max_number_parallel_meetings: Mapped[int] = mapped_column(default=2)
    calendar_ids: Mapped[list[str]] = mapped_column(
        JSONB(none_as_null=True), server_default=sa.text("'[]'::jsonb")
    )
    youtrack_projects: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB(none_as_null=True), server_default=sa.text("'[]'::jsonb")
    )
    unavailability_label: Mapped[str] = mapped_column(
        default='Onboarding not available'
    )
    chat_id: Mapped[str] = mapped_column(default='')
    content: Mapped[str | None]
