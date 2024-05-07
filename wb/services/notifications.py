from abc import abstractmethod
from enum import Enum
from typing import Any, Dict, List, Set

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import async_session
from wb.tasks import task_send_bbot_message

__all__ = (
    'NotificationMessage',
    'NotificationDestinationRole',
    'NotificationDestinationEmployee',
    'NotificationDestinationTeam',
    'Notification',
    'create_inner_notifications',
)


class NotificationDestination(Enum):
    @abstractmethod
    async def get_recipients(self, obj: Any) -> Set[str]:
        pass


class NotificationMessage:
    destination: NotificationDestination
    related_object: Any
    msg: str

    def __init__(
        self, destination: NotificationDestination, msg: str, related_object: Any = None
    ) -> None:
        self.destination = destination
        self.msg = msg
        self.related_object = related_object


class NotificationDestinationRole(NotificationDestination):
    MEMBERS = 0

    async def get_recipients(self, obj: str) -> Set[str]:
        async with async_session() as session:
            async with session.begin():
                results = await session.scalars(
                    sa.select(m.Employee).filter(
                        m.Employee.roles.any(m.EmployeeRole.role == obj),
                        m.Employee.active.is_(True),
                    )
                )
                return {emp.pararam for emp in results.all() if emp.pararam}


class NotificationDestinationEmployee(NotificationDestination):
    SELF = 0
    MANAGERS = 1
    MENTORS = 2
    WATCHERS = 3
    TEAM_LEAD = 4

    async def get_recipients(self, obj: m.Employee) -> Set[str]:
        cls = self.__class__
        if self == cls.SELF:
            if obj.pararam:
                return {obj.pararam}  # type: ignore
            return set()
        if self in (cls.MANAGERS, cls.MENTORS, cls.WATCHERS):
            mapper = {
                cls.MANAGERS: 'managers',
                cls.MENTORS: 'mentors',
                cls.WATCHERS: 'watchers',
            }
            return {u.pararam for u in getattr(obj, mapper[self]) if u.pararam}
        if self == cls.TEAM_LEAD:
            if obj.team and obj.team.manager and obj.team.manager.pararam:
                return {obj.team.manager.pararam}
            return set()
        return set()


class NotificationDestinationTeam(NotificationDestination):
    TEAM_LEAD = 0

    async def get_recipients(self, obj: m.Team) -> Set[str]:
        if obj.manager and obj.manager.pararam:
            return {obj.manager.pararam}
        return set()


class Notification:
    items: List[NotificationMessage]

    def __init__(self, items: List[NotificationMessage] | None = None) -> None:
        if items is None:
            items = []
        self.items = items

    async def send(self) -> None:
        results: Dict[str, str] = {}
        for item in self.items:
            recipients = await item.destination.get_recipients(item.related_object)
            for rec in recipients:
                if rec in results:
                    continue
                results[rec] = item.msg
        for rec, msg in results.items():
            task_send_bbot_message.delay(rec, msg)


async def create_inner_notifications(
    session: AsyncSession,
    recipients: list[int],
    subject: str,
    content: str,
    notification_type: str,
    show_on_main_page: bool,
) -> None:
    notifications = []
    for recipient_id in recipients:
        notification = m.Notification(
            recipient_id=recipient_id,
            subject=subject,
            content=content,
            type=notification_type,
            show_on_main_page=show_on_main_page,
        )
        notifications.append(notification)
    session.add_all(notifications)
    await session.commit()
