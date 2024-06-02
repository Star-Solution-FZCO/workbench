import asyncio
from datetime import date

import wb.models as m
from wb.celery_app import celery_app
from wb.db import multithreading_safe_async_session

__all__ = ('task_maintenance_create_next_month_partitions',)


async def _create_partitions(month: int, year: int) -> None:
    async with multithreading_safe_async_session() as session:
        await m.Activity.create_partition(month, year, session=session)
        await m.TMRecord.create_partition(month, year, session=session)
        await m.DoneTask.create_partition(month, year, session=session)


@celery_app.task(name='maintenance_create_next_month_partitions')
def task_maintenance_create_next_month_partitions() -> None:
    today = date.today()
    if today.month == 12:
        month = 1
        year = today.year + 1
    else:
        month = today.month + 1
        year = today.year
    print(f'start maintenance: create partitions (month = {month}, year = {year})')
    asyncio.run(_create_partitions(month, year))
    print(f'end maintenance: create partitions (month = {month}, year = {year})')
