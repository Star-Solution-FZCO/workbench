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

__all__ = ('task_weekly_null_team_check',)


async def _weekly_null_team_check() -> List[Tuple[str, str]]:
    async with multithreading_safe_async_session() as session:
        hrs_raw = await session.scalars(
            sa.select(m.Employee).filter(
                m.Employee.roles.any(
                    sa.or_(
                        m.EmployeeRole.role == 'hr', m.EmployeeRole.role == 'super_hr'
                    )
                ),
                m.Employee.active.is_(True),
            )
        )
        hrs = [hr for hr in hrs_raw.all() if hr.pararam]
        notifications: List[Tuple[str, str]] = []
        today = date.today()
        results = await session.scalars(
            sa.select(m.Employee)
            .where(
                m.Employee.active.is_(True),
                m.Employee.team_id.is_(None),
                m.Employee.work_started < today,
            )
            .options(selectinload(m.Employee.managers))
        )
        for emp in results.all():
            if emp.pararam:
                notifications.append(
                    (
                        emp.pararam,
                        f'You have not yet been assigned to a team. \n'
                        f'Please use [this page]({CONFIG.PUBLIC_BASE_URL}/teams) to choose a team and send a request for an assignment.',
                    )
                )
            msg = (
                f'[{emp.english_name}]({CONFIG.PUBLIC_BASE_URL}/employees/view/{emp.id}) (@{emp.pararam}) have not yet been assigned to a team\n'
                f'Employee needs to join team [HERE]({CONFIG.PUBLIC_BASE_URL}/teams).'
            )
            notifications.extend(
                [(manager.pararam, msg) for manager in emp.managers if manager.pararam]
            )
            notifications.extend([(hr.pararam, msg) for hr in hrs if hr.pararam])
        return notifications


@celery_app.task(name='weekly_null_team_check')
def task_weekly_null_team_check() -> None:
    print('start weekly null team check')
    results = asyncio.run(_weekly_null_team_check())
    print(results)
    for uid, msg in results:
        task_send_bbot_message.delay(uid, msg)
    print('end weekly null team check')
