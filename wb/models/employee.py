from __future__ import annotations

import re
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, List, Optional

import sqlalchemy as sa
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship
from sqlalchemy.sql import expression

from wb.config import CONFIG

from ._base import BaseDBModel
from .cooperation_type import CooperationType
from .organization import Organization
from .position import Position
from .schedule.schedule import EmployeeSchedule

if TYPE_CHECKING:
    from .employee_pool import EmployeePool
    from .tm import EmployeeTM


VALID_LOGIN = re.compile(r'^[\w.-@_0-9]{2,64}$', re.IGNORECASE)


__all__ = (
    'Employee',
    'EmployeeRole',
    'ROLES',
    'Team',
    'TeamTag',
)

ROLES = [
    'admin',
    'hr',
    'finance',
    'super_admin',
    'super_hr',
    'lawyer',
    'recruiter',
    'chief',
    'procurement',
]


class EmployeeProject(BaseDBModel):
    __tablename__ = 'asc__employee__project'

    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id',
            ondelete='CASCADE',
            name='asc__employee__project_employee_id_fkey',
        ),
        primary_key=True,
    )
    project_name: Mapped[str] = mapped_column(nullable=False, primary_key=True)

    __table_args__ = (
        sa.UniqueConstraint(
            'employee_id',
            'project_name',
            name='uc__asc__employee__project__employee_id__project_name',
        ),
    )

    def __init__(self, project_name: str):  # pylint: disable=super-init-not-called
        self.project_name = project_name


class EmployeeRole(BaseDBModel):
    __tablename__ = 'asc__employee__role'

    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id',
            ondelete='CASCADE',
            name='asc__employee__role_employee_id_fkey',
        ),
        primary_key=True,
    )
    role: Mapped[str] = mapped_column(nullable=False, primary_key=True)

    __table_args__ = (
        sa.UniqueConstraint(
            'employee_id', 'role', name='uc__asc__employee__role__employee_id__role'
        ),
    )

    def __init__(self, role: str):  # pylint: disable=super-init-not-called
        self.role = role


class EmployeeSkill(BaseDBModel):
    __tablename__ = 'asc__employee__skill'

    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id',
            ondelete='CASCADE',
            name='asc__employee__skill_employee_id_fkey',
        ),
        primary_key=True,
    )
    skill: Mapped[str] = mapped_column(nullable=False, primary_key=True)

    __table_args__ = (
        sa.UniqueConstraint(
            'employee_id', 'skill', name='uc__asc__employee__skill__employee_id__skill'
        ),
    )

    def __init__(self, skill: str):  # pylint: disable=super-init-not-called
        self.skill = skill


class EmployeeWorkNotificationChat(BaseDBModel):
    __tablename__ = 'asc__employee__work_notification_chat'

    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id',
            ondelete='CASCADE',
            name='asc__employee__work_notification_chat_employee_id_fkey',
        ),
        primary_key=True,
    )
    chat_id: Mapped[int] = mapped_column(nullable=False, primary_key=True)

    __table_args__ = (
        sa.UniqueConstraint(
            'employee_id',
            'chat_id',
            name='uc__asc__employee__work_notification_chat__employee_id__chat_id',
        ),
    )

    def __init__(self, chat_id: int):  # pylint: disable=super-init-not-called
        self.chat_id = chat_id


association_table_managers = sa.Table(
    'asc__managers',
    BaseDBModel.metadata,
    sa.Column(
        'manager_id',
        sa.ForeignKey(
            'employees.id', ondelete='CASCADE', name='asc__managers_manager_id_fkey'
        ),
        primary_key=True,
    ),
    sa.Column(
        'subordinate_id',
        sa.ForeignKey(
            'employees.id', ondelete='CASCADE', name='asc__managers_subordinate_id_fkey'
        ),
        primary_key=True,
    ),
)


association_table_mentors = sa.Table(
    'asc__mentors',
    BaseDBModel.metadata,
    sa.Column(
        'mentor_id',
        sa.ForeignKey(
            'employees.id', ondelete='CASCADE', name='asc__mentors_mentor_id_fkey'
        ),
        primary_key=True,
    ),
    sa.Column(
        'mentee_id',
        sa.ForeignKey(
            'employees.id', ondelete='CASCADE', name='asc__mentors_mentee_id_fkey'
        ),
        primary_key=True,
    ),
)

association_table_employee_team = sa.Table(
    'asc__employee__team',
    BaseDBModel.metadata,
    sa.Column(
        'team_id',
        sa.ForeignKey('teams.id', name='asc__employee__team_team_id_fkey'),
        primary_key=True,
    ),
    sa.Column(
        'employee_id',
        sa.ForeignKey(
            'employees.id',
            ondelete='CASCADE',
            name='asc__employee__team_employee_id_fkey',
        ),
        primary_key=True,
    ),
)


association_table_watchers = sa.Table(
    'asc__watchers',
    BaseDBModel.metadata,
    sa.Column(
        'watcher_id',
        sa.ForeignKey(
            'employees.id', ondelete='CASCADE', name='asc__watchers_watcher_id_fkey'
        ),
        primary_key=True,
    ),
    sa.Column(
        'watched_id',
        sa.ForeignKey(
            'employees.id', ondelete='CASCADE', name='asc__watchers_watched_id_fkey'
        ),
        primary_key=True,
    ),
)


class Employee(BaseDBModel):
    __tablename__ = 'employees'

    id: Mapped[int] = mapped_column(primary_key=True)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    revision: Mapped[int] = mapped_column(nullable=False, default=0)
    account: Mapped[str] = mapped_column(unique=True)
    english_name: Mapped[str] = mapped_column(nullable=False)
    native_name: Mapped[Optional[str]]
    email: Mapped[str] = mapped_column(nullable=False, unique=True)
    public_contacts: Mapped[Optional[str]]
    work_started: Mapped[date] = mapped_column(nullable=False)
    work_ended: Mapped[Optional[date]]
    photo: Mapped[Optional[str]]
    position_id: Mapped[Optional[int]] = mapped_column(
        sa.ForeignKey('positions.id', name='employee_position_id_fkey'),
        nullable=True,
    )
    position: Mapped[Optional['Position']] = relationship(
        foreign_keys=[position_id], lazy='selectin'
    )
    managers: Mapped[List['Employee']] = relationship(
        secondary=association_table_managers,
        primaryjoin=association_table_managers.c.subordinate_id == id,
        secondaryjoin=association_table_managers.c.manager_id == id,
    )
    _projects: Mapped[List['EmployeeProject']] = relationship(
        cascade='all, delete-orphan', lazy='selectin'
    )
    projects: AssociationProxy[List[str]] = association_proxy(
        '_projects', 'project_name'
    )
    grade: Mapped[Optional[str]]
    grade_updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    grade_reason: Mapped[Optional[str]]
    mentors: Mapped[List['Employee']] = relationship(
        secondary=association_table_mentors,
        primaryjoin=association_table_mentors.c.mentee_id == id,
        secondaryjoin=association_table_mentors.c.mentor_id == id,
    )
    organization_id: Mapped[Optional[int]] = mapped_column(
        sa.ForeignKey('organizations.id', name='employee_organization_id_fkey'),
        nullable=True,
    )
    organization: Mapped[Optional['Organization']] = relationship(
        foreign_keys=[organization_id], lazy='selectin'
    )
    cooperation_type_id: Mapped[Optional[int]] = mapped_column(
        sa.ForeignKey('cooperation_types.id', name='employee_cooperation_type_id_fkey'),
        nullable=True,
    )
    cooperation_type: Mapped[Optional['CooperationType']] = relationship(
        foreign_keys=[cooperation_type_id], lazy='selectin'
    )
    contract_date: Mapped[Optional[date]]
    _roles: Mapped[List['EmployeeRole']] = relationship(
        cascade='all, delete-orphan', lazy='selectin'
    )
    roles: AssociationProxy[List[str]] = association_proxy('_roles', 'role')
    team_id: Mapped[Optional[int]] = mapped_column(
        sa.ForeignKey('teams.id', name='employee_team_id_fkey'),
        nullable=True,
    )
    team: Mapped[Optional['Team']] = relationship(
        foreign_keys=[team_id], lazy='selectin'
    )
    team_position: Mapped[Optional[str]]
    active: Mapped[bool] = mapped_column(nullable=False, default=False)
    _skills: Mapped[List['EmployeeSkill']] = relationship(
        cascade='all, delete-orphan', lazy='selectin'
    )
    skills: AssociationProxy[List[str]] = association_proxy('_skills', 'skill')
    about: Mapped[Optional[str]]
    birthday: Mapped[Optional[date]]
    timezone: Mapped[str] = mapped_column(nullable=False, default=str(timezone.utc))
    availability_time_start: Mapped[Optional[str]]
    availability_time_end: Mapped[Optional[str]]
    _work_notifications_chats: Mapped[List['EmployeeWorkNotificationChat']] = (
        relationship(cascade='all, delete-orphan', lazy='selectin')
    )
    work_notifications_chats: AssociationProxy[List[int]] = association_proxy(
        '_work_notifications_chats', 'chat_id'
    )
    archive: Mapped[Optional[str]]
    pararam: Mapped[Optional[str]]
    watchers: Mapped[List['Employee']] = relationship(
        secondary=association_table_watchers,
        primaryjoin=association_table_watchers.c.watched_id == id,
        secondaryjoin=association_table_watchers.c.watcher_id == id,
    )
    dismissal_reason: Mapped[Optional[str]]
    probation_period_justification: Mapped[Optional[str]]
    probation_period_started: Mapped[Optional[date]]
    probation_period_ended: Mapped[Optional[date]]
    disable_activity_monitor: Mapped[bool] = mapped_column(
        server_default=expression.false()
    )
    pool_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey('employee_pools.id', name='employee_pool_id_fkey'), nullable=True
    )
    pool: Mapped['EmployeePool | None'] = relationship(lazy='selectin')

    tm: Mapped['EmployeeTM | None'] = relationship(
        back_populates='employee',
        lazy='selectin',
    )

    def __repr__(self) -> str:
        return f'<Employee {self.account}>'

    def __str__(self) -> str:
        return str(self.account)

    def __hash__(self) -> int:
        return hash(self.account)

    def __eq__(self, other: object) -> bool:
        if isinstance(other, Employee):
            return bool(self.account == other.account)
        return False

    @property
    def is_admin(self) -> bool:
        return 'admin' in self.roles or 'super_admin' in self.roles

    @property
    def is_super_admin(self) -> bool:
        return 'super_admin' in self.roles

    @property
    def is_hr(self) -> bool:
        return 'hr' in self.roles or 'super_hr' in self.roles

    @property
    def is_super_hr(self) -> bool:
        return 'super_hr' in self.roles

    @property
    def link_pararam(self) -> str:
        lnk = (
            f'[{self.english_name}]({CONFIG.PUBLIC_BASE_URL}/employees/view/{self.id})'
        )
        if self.pararam:
            lnk += f' (@{self.pararam})'
        return lnk

    holiday_set_id: Mapped[int | None] = column_property(
        sa.select(EmployeeSchedule.holiday_set_id)
        .where(
            EmployeeSchedule.employee_id == id,
            EmployeeSchedule.start <= sa.func.current_date(),  # pylint: disable=not-callable
            sa.or_(
                EmployeeSchedule.end.is_(None),
                EmployeeSchedule.end >= sa.func.current_date(),  # pylint: disable=not-callable
            ),
        )
        .scalar_subquery()
    )

    def up_revision(self) -> None:
        self.updated = datetime.utcnow()
        self.revision += 1


association_table__team__team_tag = sa.Table(
    'asc__team__team_tag',
    BaseDBModel.metadata,
    sa.Column(
        'team_id',
        sa.ForeignKey(
            'teams.id',
            ondelete='CASCADE',
            name='asc__team__team_tag_team_id_fkey',
        ),
        primary_key=True,
    ),
    sa.Column(
        'team_tag_id',
        sa.ForeignKey(
            'team_tags.id',
            ondelete='CASCADE',
            name='asc__team__team_tag_team_tag_id_fkey',
        ),
        primary_key=True,
    ),
)


class Team(BaseDBModel):
    __tablename__ = 'teams'

    id: Mapped[int] = mapped_column(primary_key=True)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    revision: Mapped[int] = mapped_column(nullable=False, default=0)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    key: Mapped[str | None]
    description: Mapped[Optional[str]]
    manager_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey('employees.id', name='team_manager_id_fkey'),
        nullable=True,
    )
    manager: Mapped['Employee | None'] = relationship(
        foreign_keys=[manager_id], lazy='selectin'
    )
    head_team_id: Mapped[int | None] = mapped_column(
        sa.ForeignKey('teams.id', name='team_head_team_id_fkey'), nullable=True
    )
    head_team: Mapped[Optional['Team']] = relationship(
        remote_side=[id],
        back_populates='sub_teams',
        lazy='selectin',
    )
    sub_teams: Mapped[List['Team']] = relationship(
        back_populates='head_team',
        lazy='selectin',
    )
    is_archived: Mapped[bool] = mapped_column(server_default=expression.false())

    tags: Mapped[list['TeamTag']] = relationship(
        secondary=association_table__team__team_tag,
        lazy='selectin',
    )

    def up_revision(self) -> None:
        self.updated = datetime.utcnow()
        self.revision += 1


class TeamTag(BaseDBModel):
    __tablename__ = 'team_tags'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    description: Mapped[str]
    color: Mapped[str | None]
    is_archived: Mapped[bool] = mapped_column(server_default=expression.false())
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    revision: Mapped[int] = mapped_column(nullable=False, default=0)

    teams: Mapped[list['Team']] = relationship(
        secondary=association_table__team__team_tag,
    )

    def up_revision(self) -> None:
        self.updated = datetime.utcnow()
        self.revision += 1
