import asyncio

from wb.activity_collector.collector import load_all_activities
from wb.celery_app import celery_app
from wb.db import multithreading_safe_async_session

__all__ = ('task_collect_activities',)


@celery_app.task(name='collect_activities')
def task_collect_activities() -> None:
    print('start collect activities')
    asyncio.run(load_all_activities(session_maker=multithreading_safe_async_session))
    print('end collect activities')
