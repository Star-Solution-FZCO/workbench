from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Sequence

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.activity_collector.models import EmployeeActivitySourceAlias
from wb.models.activity import Activity, ActivitySource

__all__ = (
    'Connector',
    'DoneTask',
)


@dataclass
class DoneTask:
    employee_id: int
    source_id: int
    time: datetime
    task_type: str
    task_id: str | None = None
    task_name: str | None = None
    task_link: str | None = None
    meta: dict | None = None


class Connector(ABC):
    source: ActivitySource

    @classmethod
    @abstractmethod
    def validate_config(cls, conf: Any) -> None:
        pass

    def __init__(self, source: ActivitySource):
        self.validate_config(source.config)
        self.source = source

    async def get_stored_aliases(self, session: AsyncSession) -> Dict[str, int]:
        results = await session.scalars(
            sa.select(EmployeeActivitySourceAlias).where(
                EmployeeActivitySourceAlias.source_id == self.source.id
            )
        )
        return {res.alias: res.employee_id for res in results.all()}

    @abstractmethod
    async def get_activities(
        self, start: float, end: float, aliases: Dict[str, int]
    ) -> List[Activity]:
        pass

    @abstractmethod
    async def get_users(self, employees: Sequence[m.Employee]) -> Dict[int, str]:
        pass

    @abstractmethod
    async def get_done_tasks(
        self, start: float, end: float, aliases: dict[str, int]
    ) -> dict[int, list[DoneTask]]:
        raise NotImplementedError()
