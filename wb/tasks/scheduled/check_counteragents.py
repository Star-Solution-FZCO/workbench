import asyncio
from datetime import date
from typing import List, Tuple

import sqlalchemy as sa
from sqlalchemy.orm import selectinload

import wb.models as m
from wb.celery_app import celery_app
from wb.config import CONFIG
from wb.db import multithreading_safe_async_session
from wb.tasks.send import task_send_bbot_message

__all__ = ('monthly_counteragents_check',)


def is_time_to_send(today: date, schedule: str) -> bool:
    if schedule == 'every_month' and today.day == 1:
        return True
    if schedule == 'every_3_months' and today.day == 1 and today.month % 3 == 1:
        return True
    if schedule == 'every_6_months' and today.day == 1 and today.month % 6 == 1:
        return True
    return False


async def _monthly_counteragents_check() -> List[Tuple[str, str]]:
    async with multithreading_safe_async_session() as session:
        counteragents_raw = await session.scalars(
            sa.select(m.CounterAgent)
            .filter(
                m.CounterAgent.status != m.CounterAgentStatus.INVALID,
                ~m.CounterAgent.agents.any(),
            )
            .options(
                selectinload(m.CounterAgent.manager),
            )
        )
        today = date.today()
        counteragents = [
            c for c in counteragents_raw.all() if is_time_to_send(today, c.schedule)
        ]
        managers = {c.manager_id for c in counteragents}
        manager_counteragents = {
            c.manager_id: [c for c in counteragents if c.manager_id == c.manager_id]
            for c in counteragents
        }
        results = await session.scalars(
            sa.select(m.Employee).filter(
                m.Employee.id.in_(managers),
                m.Employee.active.is_(True),
                m.Employee.work_started < today,
                m.Employee.pararam.isnot(None),
            )
        )
        notifications: List[Tuple[str, str]] = []
        for emp in results.all():
            counteragent_list_msg = '\n'.join(
                f'[{c.english_name}]({CONFIG.PUBLIC_BASE_URL}/counteragents/view/{c.id}/)'
                for c in manager_counteragents[emp.id]
            )
            message = (
                'You need to confirm the data about the work of your subordinate counteragents and the need for access to them at the moment.\n'
                + counteragent_list_msg
            )
            notifications.append((emp.pararam, message))
        return notifications


@celery_app.task(name='monthly_counteragents_check')
def monthly_counteragents_check() -> None:
    print('start monthly counteragents check')
    results = asyncio.run(_monthly_counteragents_check())
    for uid, msg in results:
        task_send_bbot_message.delay(uid, msg)
    print('end monthly counteragents check')
