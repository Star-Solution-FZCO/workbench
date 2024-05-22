import asyncio

from wb.celery_app import celery_app
from wb.db import multithreading_safe_async_session
from wb.linked_accounts_collector.collector import update_accounts

__all__ = ('task_update_linked_accounts',)


@celery_app.task(name='update_linked_accounts')
def task_update_linked_accounts() -> None:
    print('start updating linked accounts')
    asyncio.run(update_accounts(session_maker=multithreading_safe_async_session))
    print('end updating linked accounts')
