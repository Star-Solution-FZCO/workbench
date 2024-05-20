import datetime
import json
from typing import Any, Dict, List, Sequence

import aiohttp

import wb.models as m
from wb.models.activity import Activity, ActivitySource

from .base import Connector, DoneTask

__all__ = ('CVSConnector',)


class CVSConnector(Connector):
    __api_url: str

    @classmethod
    def validate_config(cls, conf: Any) -> None:
        if not isinstance(conf, dict):
            raise TypeError('config is not dict')
        if 'api_url' not in conf:
            raise KeyError('"api_url" is not in config')

    def __init__(self, source: ActivitySource):
        super().__init__(source)
        self.__api_url = source.config.get('api_url')  # type: ignore

    async def get_activities(
        self, start: float, end: float, aliases: Dict[str, int]
    ) -> List[Activity]:
        results: List[Activity] = []
        start_ts = int(start)
        end_ts = int(end)

        url = (
            f'{self.__api_url}/commit?start_ts={start_ts}&end_ts={end_ts}&changes=false'
        )
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, ssl=False) as response:
                    cvs_data = json.loads(await response.read())
        except Exception as err:  # pylint: disable=broad-exception-caught
            print(
                f'{self.get_activities.__name__}: get activities from {url} failed with error = {err}'
            )
            return results
        for c in cvs_data:
            if employee_id := aliases.get(c['author']):
                results.append(
                    Activity(
                        employee_id=employee_id,
                        source_id=self.source.id,
                        action='COMMIT',
                        time=datetime.datetime.utcfromtimestamp(c['timestamp']),
                        target_id=c['repo'],
                        target_link='',
                        target_name='',
                    )
                )
        print(f'{self.source.name}: loaded {len(results)} activity')
        return results

    async def get_users(self, employees: Sequence[m.Employee]) -> Dict[int, str]:
        return {emp.id: emp.account for emp in employees}

    async def get_done_tasks(
        self, start: float, end: float, aliases: dict[str, int]
    ) -> dict[int, list[DoneTask]]:
        return {}
