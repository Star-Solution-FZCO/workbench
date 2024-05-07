import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Sequence, Tuple

from pararamio import ActivityAction, PararamioBot

import wb.models as m
from wb.models.activity import Activity, ActivitySource

from .base import Connector

__all__ = ('PararamConnector',)

ALLOWED_ACTIONS = (ActivityAction.POST,)
USERS_CHUNK_SIZE = 20


def ts_to_datetime(timestamp: float) -> datetime:
    return datetime.utcfromtimestamp(timestamp).replace(tzinfo=timezone.utc)


def datetime_aware_to_naive(dt: datetime) -> datetime:
    return dt.astimezone(tz=timezone.utc).replace(tzinfo=None)


class PararamConnector(Connector):
    __bot: PararamioBot

    @classmethod
    def validate_config(cls, conf: Any) -> None:
        if not isinstance(conf, dict):
            raise TypeError('config is not dict')
        if 'key' not in conf:
            raise KeyError('"key" not in config')

    def __init__(self, source: ActivitySource):
        super().__init__(source)
        self.__bot = PararamioBot(source.config.get('key'))  # type: ignore

    async def _get_activities(
        self, start: float, end: float, user: Tuple[str, int]
    ) -> List[Activity]:
        results = []
        loop = asyncio.get_running_loop()
        raw_results = await loop.run_in_executor(
            None,
            self.__bot.get_user_activity,
            int(user[0]),
            ts_to_datetime(start),
            ts_to_datetime(end),
            list(ALLOWED_ACTIONS),
        )
        for r in raw_results:
            if r.action not in ALLOWED_ACTIONS:
                continue
            results.append(
                Activity(
                    employee_id=user[1],
                    source_id=self.source.id,
                    action=r.action.name,
                    time=datetime_aware_to_naive(r.time),
                    target_id='',
                    target_link='',
                    target_name='',
                )
            )
        return results

    async def get_activities(
        self, start: float, end: float, aliases: Dict[str, int]
    ) -> List[Activity]:
        results = []
        all_users = list(aliases.keys())
        i = 0
        while i < len(all_users):
            res = await asyncio.gather(
                *[
                    self._get_activities(start, end, (u, aliases[u]))
                    for u in all_users[i : i + USERS_CHUNK_SIZE]
                ],
                return_exceptions=True,
            )
            for r in res:
                if isinstance(r, Exception):
                    continue
                results.extend(r)
            i += USERS_CHUNK_SIZE
        print(f'{self.source.name}: loaded {len(results)} activity')
        return results

    def _resolve_user_names(self, users: Sequence[str]) -> dict[str, int]:
        data = self.__bot.request(f'/core/user?unames={",".join(users)}')
        return {
            u['unique_name']: u['id']
            for u in data.get('users', [])
            if u['unique_name'] in users
        }

    async def get_users(self, employees: Sequence[m.Employee]) -> Dict[int, str]:
        employee_ids_by_pararam: dict[str, int] = {
            emp.pararam: emp.id for emp in employees if emp.pararam
        }
        results: dict[int, str] = {}
        chunks = [
            list(employee_ids_by_pararam.keys())[i : i + USERS_CHUNK_SIZE]
            for i in range(0, len(employee_ids_by_pararam), USERS_CHUNK_SIZE)
        ]
        for chunk in chunks:
            users = self._resolve_user_names(chunk)
            results.update(
                {
                    employee_ids_by_pararam[uname]: str(uid)
                    for uname, uid in users.items()
                }
            )
        return results
