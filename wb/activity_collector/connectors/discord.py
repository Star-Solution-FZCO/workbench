import logging
from collections.abc import AsyncIterator, Sequence
from datetime import datetime
from http import HTTPMethod
from typing import Any
from urllib.parse import quote, urljoin

import aiohttp
import jwt

import wb.models as m
from wb.models.activity import Activity, ActivitySource

from .base import Connector

__all__ = ('DiscordConnector',)


class DiscordConnector(Connector):
    _base_url: str
    _api_token_kid: str
    __api_token_secret: str

    @classmethod
    def validate_config(cls, conf: Any) -> None:
        if not isinstance(conf, dict):
            raise TypeError('config is not dict')
        if 'api_base_url' not in conf:
            raise KeyError('"api_base_url" is not in config')
        if 'api_token_kid' not in conf:
            raise KeyError('"api_token_kid" is not in config')
        if 'api_token_secret' not in conf:
            raise KeyError('"api_token_secret" is not in config')

    def __init__(self, source: ActivitySource):
        super().__init__(source)
        self._base_url = source.config['api_base_url']  # type: ignore
        self._api_token_kid = source.config['api_token_kid']  # type: ignore
        self.__api_token_secret = source.config['api_token_secret']  # type: ignore

    @property
    def base_url(self) -> str:
        return self._base_url

    def _gen_api_token(self) -> str:
        data = {'exp': datetime.now().timestamp() + 60}
        token = jwt.encode(
            data,
            self.__api_token_secret,
            algorithm='HS256',
            headers={'kid': self._api_token_kid},
        )
        return token

    async def _request_api(
        self,
        endpoint: str,
        params: dict | None = None,
        method: HTTPMethod = HTTPMethod.GET,
        data: dict | None = None,
        headers: dict[str, str] | None = None,
    ) -> dict | list | None:
        headers = {
            'Authorization': f'Bearer {self._gen_api_token()}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            **(headers or {}),
        }
        url = urljoin(self.base_url, endpoint)
        if params:
            url += '?' + '&'.join([f'{k}={quote(str(v))}' for k, v in params.items()])
        try:
            async with aiohttp.ClientSession(headers=headers) as session:
                async with session.request(method, url, json=data) as response:
                    result = await response.json()
            if not isinstance(result, dict):
                raise ValueError('API response is not a dict')
            if 'payload' not in result:
                raise ValueError('API response does not contain payload')
        except Exception as err:  # pylint: disable=broad-exception-caught
            logging.error(f'request to {url} failed with error={err}')
            return {}
        return result['payload']

    async def get_objects(
        self,
        endpoint: str,
        params: dict | None = None,
        load_per_request: int = 100,
    ) -> AsyncIterator:
        step = 0
        while True:
            resp = await self._request_api(
                endpoint,
                params={
                    **(params or {}),
                    'limit': load_per_request,
                    'offset': step * load_per_request,
                },
                method=HTTPMethod.GET,
            )
            if not resp:
                return
            for res in resp['items']:
                yield res
            if resp['count'] <= (step + 1) * load_per_request:
                return
            step += 1

    async def get_activities(
        self, start: float, end: float, aliases: dict[str, int]
    ) -> list[Activity]:
        results: list[Activity] = []
        params = {
            'start': start,
            'end': end,
        }
        date_iter = self.get_objects('/api/v1/activity/list', params=params)
        async for act in date_iter:
            if employee_id := aliases.get(act['user']):
                results.append(
                    Activity(
                        employee_id=employee_id,
                        source_id=self.source.id,
                        action='call',
                        time=datetime.utcfromtimestamp(act['time']),
                        target_id='',
                        target_link='',
                        target_name='',
                        duration=act.get('duration', 0),
                    )
                )
        print(f'{self.source.name}: loaded {len(results)} activity')
        return results

    async def get_users(self, employees: Sequence[m.Employee]) -> dict[int, str]:
        employees_ids_by_email = {emp.email: emp.id for emp in employees}
        response = {
            obj['email']
            async for obj in self.get_objects('/api/v1/user/list')
            if 'email' in obj
        }
        return {
            employees_ids_by_email[u]: u
            for u in response.intersection(set(employees_ids_by_email.keys()))
        }
