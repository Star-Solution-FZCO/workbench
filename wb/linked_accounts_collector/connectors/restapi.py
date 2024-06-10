import asyncio
from collections.abc import Sequence
from http import HTTPMethod
from typing import TYPE_CHECKING, Any, Literal

import aiohttp

from wb.log import log

from .base import AccountData, ConfigValidationError, Connector

if TYPE_CHECKING:
    from wb.models.employee import Employee
    from wb.models.linked_accounts import LinkedAccountSource

__all__ = ('RestAPIConnector',)

ACCOUNTS_BULK_LOAD_CHUNK_SIZE = 10
ACCOUNTS_BULK_LOAD_PAUSE = 1


class RestAPIConnector(Connector):
    url: str
    search_field_name: str
    result_field_name: str
    request_method: Literal[HTTPMethod.GET, HTTPMethod.POST]
    params_format: Literal['json', 'form', 'query']
    status_field_name: str | None
    status_active_values: list[str] | None

    def __init__(self, source: 'LinkedAccountSource'):
        super().__init__(source)
        self.url = source.config['url']
        self.search_field_name = source.config['search_field_name']
        self.result_field_name = source.config['result_field_name']
        self.request_method = HTTPMethod[source.config.get('request_method', 'GET')]
        self.params_format = source.config.get('params_format', 'query')
        self.status_field_name = source.config.get('status_field_name')
        self.status_active_values = source.config.get('status_active_values')

    @classmethod
    def validate_config(cls, conf: Any) -> None:
        if not isinstance(conf, dict):
            raise ConfigValidationError('config is not dict')
        for k in (
            'url',
            'search_field_name',
            'result_field_name',
        ):
            if k not in conf:
                raise ConfigValidationError(f'"{k}" not in config')
        if 'request_method' in conf:
            if not isinstance(conf['request_method'], str):
                raise ConfigValidationError('request_method is not str')
            if conf['request_method'] not in ('GET', 'POST'):
                raise ConfigValidationError('Invalid request_method')

    async def _request(self, search_field_value: str) -> dict:
        url = self.url
        data = None
        headers = None
        if self.params_format == 'query':
            url += f'?{self.search_field_name}={search_field_value}'
        elif self.params_format == 'json':
            headers = {'Content-Type': 'application/json'}
            data = {self.search_field_name: search_field_value}
        elif self.params_format == 'form':
            headers = {'Content-Type': 'application/x-www-form-urlencoded'}
            data = {self.search_field_name: search_field_value}
        log.debug(f'Requesting {url} with data: {data}')
        log.debug(f'Headers: {headers}')
        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.request(self.request_method, url, data=data) as response:
                return await response.json()

    def _parse_status(self, data: dict) -> bool:
        if self.status_field_name is None:
            return True
        status = data[self.status_field_name]
        if self.status_active_values is None:
            return bool(status)
        return str(status) in self.status_active_values

    async def get_account(self, emp: 'Employee') -> AccountData | None:
        try:
            data = await self._request(emp.email)
            log.debug(f'Got data: {data}')
            return AccountData(
                id=data[self.result_field_name],
                active=self._parse_status(data),
            )
        except Exception as err:  # pylint: disable=broad-exception-caught
            log.exception('Error during getting account data: %s', err)
            return None

    async def _get_accounts(
        self, employees: Sequence['Employee']
    ) -> dict[int, AccountData | None]:
        results = await asyncio.gather(*[self.get_account(emp) for emp in employees])
        return {emp.id: result for emp, result in zip(employees, results)}

    async def get_accounts(
        self, employees: Sequence['Employee']
    ) -> dict[int, AccountData | None]:
        chunks = [
            employees[i : i + ACCOUNTS_BULK_LOAD_CHUNK_SIZE]
            for i in range(0, len(employees), ACCOUNTS_BULK_LOAD_CHUNK_SIZE)
        ]
        results = {}
        for chunk in chunks:
            chunk_result = await self._get_accounts(chunk)
            results.update(chunk_result)
            await asyncio.sleep(ACCOUNTS_BULK_LOAD_PAUSE)
        return results
