from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from wb.db import BaseDBModel

from .employee import Employee
from .quiz import Quiz

__all__ = (
    'Policy',
    'PolicyRevision',
    'PolicyRevisionApproveRecord',
    'PolicyEmployeeExclusion',
)


class PolicyRevisionApproveRecord(BaseDBModel):
    __tablename__ = 'policy_revision__approve_records'

    policy_revision_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'policy_revisions.id',
            name='policy_revision__approve_records_policy_revision_id_fkey',
        ),
        primary_key=True,
    )
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id',
            name='policy_revision__approve_records_employee_id_fkey',
            ondelete='CASCADE',
        ),
        nullable=False,
        primary_key=True,
    )
    approved: Mapped[datetime]


class PolicyRevision(BaseDBModel):
    __tablename__ = 'policy_revisions'

    id: Mapped[int] = mapped_column(primary_key=True)
    policy_id: Mapped[int] = mapped_column(
        sa.ForeignKey('policies.id', name='policy__revision_policy_id_fkey')
    )
    policy_revision: Mapped[int]
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    created_by_id: Mapped[int] = mapped_column(
        sa.ForeignKey('employees.id', name='policy__revision_created_by_id_fkey'),
        nullable=False,
    )
    created_by: Mapped[Employee | None] = relationship(
        foreign_keys=[created_by_id], lazy='selectin'
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated_by_id: Mapped[int] = mapped_column(
        sa.ForeignKey('employees.id', name='policy__revision_updated_by_id_fkey'),
        nullable=False,
    )
    updated_by: Mapped[Employee | None] = relationship(
        foreign_keys=[updated_by_id], lazy='selectin'
    )
    published: Mapped[datetime | None]
    published_by_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey('employees.id', name='policy__revision_published_by_id_fkey')
    )
    published_by: Mapped[Employee | None] = relationship(
        foreign_keys=[published_by_id], lazy='selectin'
    )
    text: Mapped[str] = mapped_column(sa.TEXT(), nullable=False)

    __table_args__ = (
        sa.UniqueConstraint(
            'policy_id',
            'policy_revision',
            name='uc__policy_revisions__policy_id__policy_revision',
        ),
    )


class PolicyEmployeeExclusion(BaseDBModel):
    __tablename__ = 'policy__employee_exclusions'

    policy_id: Mapped[int] = mapped_column(
        sa.ForeignKey('policies.id', name='policy__employee_exclusions_policy_id_fkey'),
        primary_key=True,
    )
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id',
            ondelete='CASCADE',
            name='policy__employee_exclusions_employee_id_fkey',
        ),
        primary_key=True,
    )
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    created_by_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id', name='policy__employee_exclusions_created_by_id_fkey'
        )
    )


class Policy(BaseDBModel):
    __tablename__ = 'policies'

    id: Mapped[int] = mapped_column(primary_key=True)
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    revision: Mapped[int] = mapped_column(nullable=False, default=0)  # audit revision
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    canceled: Mapped[datetime | None]
    canceled_by_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey('employees.id', name='policies_canceled_by_id_fkey')
    )
    canceled_by: Mapped[Employee | None] = relationship(
        foreign_keys=[canceled_by_id], lazy='selectin'
    )
    quiz_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey('quizzes.id', name='policies_quiz_id_fkey')
    )
    quiz: Mapped[Quiz | None] = relationship(foreign_keys=[quiz_id], lazy='selectin')

    def up_revision(self) -> None:
        self.updated = datetime.utcnow()  # type: ignore
        self.revision += 1
