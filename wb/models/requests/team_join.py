import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..employee import Employee, Team
from .request import Request

__all__ = ('JoinTeamRequest',)


class JoinTeamRequest(Request):
    __tablename__ = 'requests__team_join'
    __request_type__: str = 'JOIN_TEAM'

    id: Mapped[int] = mapped_column(primary_key=True)
    closed_by_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey('employees.id', name='requests__team_join_closed_by_id_fkey')
    )
    closed_by: Mapped[Employee | None] = relationship(
        foreign_keys=[closed_by_id], lazy='selectin'
    )
    approved_by_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey('employees.id', name='requests__team_join_approved_by_id_fkey')
    )
    approved_by: Mapped[Employee | None] = relationship(
        foreign_keys=[approved_by_id], lazy='selectin'
    )
    applicant_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id',
            ondelete='CASCADE',
            name='requests__team_join_applicant_id_fkey',
        ),
        nullable=False,
    )
    applicant: Mapped[Employee] = relationship(
        foreign_keys=[applicant_id], lazy='selectin'
    )
    team_id: Mapped[int] = mapped_column(
        sa.ForeignKey('teams.id', name='requests__team_join_team_id_fkey')
    )
    team: Mapped[Team] = relationship(foreign_keys=[team_id], lazy='selectin')
    subject: Mapped[str | None]
    message: Mapped[str | None]
    reason: Mapped[str | None]
