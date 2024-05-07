import asyncio
from datetime import datetime, timedelta
from typing import Dict, List

import sqlalchemy as sa
from sqlalchemy.orm import selectinload

import wb.models as m
from wb.celery_app import celery_app
from wb.config import CONFIG
from wb.db import multithreading_safe_async_session
from wb.tasks.send import task_send_bbot_message

__all__ = ('task_quarter_grade_checks',)


GRADE_UPDATE_WARNING_DAYS = 6 * 30


async def _quarter_grade_checks() -> Dict[str, List[str]]:
    async with multithreading_safe_async_session() as session:
        manager_notifications: Dict[str, List[str]] = {}
        results = await session.scalars(
            sa.select(m.Employee)
            .where(m.Employee.active.is_(True))
            .options(selectinload(m.Employee.managers))
        )
        for emp in results.all():
            if not emp.managers:
                continue
            if emp.grade_updated > datetime.utcnow() - timedelta(
                days=GRADE_UPDATE_WARNING_DAYS
            ):
                continue
            for manager in emp.managers:
                if not manager.pararam:
                    continue
                if manager.pararam not in manager_notifications:
                    manager_notifications[manager.pararam] = []
                current_grade = emp.grade if emp.grade else 'n/a'
                manager_notifications[manager.pararam].append(
                    f'[{emp.english_name}]({CONFIG.PUBLIC_BASE_URL}/employees/view/{emp.id}) (@{emp.pararam}), '
                    f'current grade - **{current_grade}** was update more than {GRADE_UPDATE_WARNING_DAYS} '
                    f'days ago at {emp.grade_updated.strftime("%d %b %Y")}'
                )
        return manager_notifications


@celery_app.task(name='quarter_grade_check')
def task_quarter_grade_checks() -> None:
    print('start quarter grade check')
    result = asyncio.run(_quarter_grade_checks())
    for uid, notifications in result.items():
        if not notifications:
            continue
        grade_url = ''
        if CONFIG.WIKI_GRADES_URL:
            grade_url = (
                f'[Here]({CONFIG.WIKI_GRADES_URL}) '
                'you can find the instruction how to do it and more information about grades.\n'
            )
        msg = (
            'List of your subordinates with long time not updated grades, '
            'please assess their grades on their profile pages.\n'
            f'{grade_url}'
            '\n'
        )
        msg += '\n'.join(notifications)
        task_send_bbot_message.delay(uid, msg)
    print('end quarter grade check')
