import asyncio
import base64
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Sequence
from urllib.parse import quote

import aiohttp

import wb.models as m
from wb.models.activity import Activity, ActivitySource

from .base import Connector

__all__ = ('ZendeskConnector',)


MAX_RESPONSE_LIST_SIZE = 1000


def datetime_to_zendesk_time(dt: datetime) -> str:
    return dt.strftime('%Y-%m-%dT%H:%M:%SZ')


def zendesk_time_to_datetime(s: str) -> datetime:
    return datetime.strptime(s, '%Y-%m-%dT%H:%M:%SZ')


def encode_arg(key: str, value: Any) -> str:
    if isinstance(value, list):
        return '&'.join([f'{key}[]={quote(str(v))}' for v in value])
    return f'{key}={quote(str(value))}'


class ZendeskConnector(Connector):
    __url: str
    __service_user_email: str
    __token: str

    @classmethod
    def validate_config(cls, conf: Any) -> None:
        if not isinstance(conf, dict):
            raise TypeError('config is not dict')
        for k in (
            'url',
            'token',
            'service_user_email',
        ):
            if k not in conf:
                raise KeyError(f'"{k}" not in config')

    def __init__(self, source: ActivitySource):
        super().__init__(source)
        self.__url = source.config.get('url')  # type: ignore
        self.__token = source.config.get('token')  # type: ignore
        self.__service_user_email = source.config.get('service_user_email')  # type: ignore

    async def _request_api_get(
        self, url: str, args: Dict[str, Any] | None = None
    ) -> Any:
        token = f'{self.__service_user_email}/token:{self.__token}'
        token = base64.b64encode(token.encode('ascii')).decode('ascii')
        headers = {
            'Authorization': f'Basic {token}',
        }
        if not url.startswith('https://'):
            url = f'{self.__url}/api/v2/{url}'
        if args:
            url += '?' + '&'.join([encode_arg(k, v) for k, v in args.items()])
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, ssl=False) as response:
                    return json.loads(await response.read())
        except Exception as err:  # pylint: disable=broad-exception-caught
            print(f'{err}')
            logging.error(f'request to {url} failed with error={err}')
        return {}

    async def _request_list(
        self, url: str, entity_name: str, args: Dict[str, Any] | None = None
    ) -> List[Any]:
        response = await self._request_api_get(url, args=args)
        results: List[Any] = response.get(entity_name, [])
        if next_page := response.get('next_page'):
            results += await self._request_list(next_page, entity_name)
        return results

    async def _get_search_count(self, query: List[str]) -> int:
        count_result = await self._request_api_get(
            'search/count.json', args={'query': ' '.join(query)}
        )
        return count_result.get('count', 0)  # type: ignore

    async def _search_updated_tickets(
        self, start: datetime, end: datetime
    ) -> List[Any]:
        query = [
            'type:ticket',
            f'updated>{datetime_to_zendesk_time(start)}',
            f'updated<={datetime_to_zendesk_time(end)}',
        ]
        count = await self._get_search_count(query)
        if count > MAX_RESPONSE_LIST_SIZE:
            delta = int((end - start).total_seconds() * (10**6) / 2)
            left, right = await asyncio.gather(
                self._search_updated_tickets(
                    start, start + timedelta(microseconds=delta)
                ),
                self._search_updated_tickets(
                    start + timedelta(microseconds=delta + 1), end
                ),
            )
            return left + right  # type: ignore
        return await self._request_list(
            'search.json', entity_name='results', args={'query': ' '.join(query)}
        )

    async def get_activities(
        self, start: float, end: float, aliases: Dict[str, int]
    ) -> List[Activity]:
        results: List[Activity] = []
        start_dt = datetime.utcfromtimestamp(start)
        end_dt = datetime.utcfromtimestamp(end)
        tickets = await self._search_updated_tickets(start_dt, end_dt)
        for ticket in tickets:
            audits = await self._request_list(
                f'tickets/{ticket["id"]}/audits.json', entity_name='audits'
            )
            for rec in audits:
                created = zendesk_time_to_datetime(rec['created_at'])
                if not start_dt <= created <= end_dt:
                    continue
                if not (author_id := rec.get('author_id')):
                    continue
                if not (employee_id := aliases.get(str(author_id))):
                    continue
                results.append(
                    Activity(
                        employee_id=employee_id,
                        source_id=self.source.id,
                        action='COMMENT',
                        time=created,
                        target_id=str(ticket['id']),
                        target_link='',
                        target_name='',
                    )
                )
        print(f'{self.source.name}: loaded {len(results)} activity')
        return results

    async def get_users(self, employees: Sequence[m.Employee]) -> Dict[int, str]:
        employees_ids = {emp.email: emp.id for emp in employees}
        response = await self._request_list(
            'users.json', entity_name='users', args={'role': ['agent', 'admin']}
        )
        return {
            employees_ids[u['email']]: str(u['id'])
            for u in response
            if u['email'] in employees_ids
        }
