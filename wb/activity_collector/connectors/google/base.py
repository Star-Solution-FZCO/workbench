import datetime
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Sequence, Union

from aiogoogle import Aiogoogle
from aiogoogle.auth.creds import ServiceAccountCreds

import wb.models as m
from wb.models.activity import Activity, ActivitySource

from ..base import Connector

__all__ = ('GoogleReportConnector',)


SCOPES = ['https://www.googleapis.com/auth/admin.reports.audit.readonly']


class NoPrimaryEventException(Exception):
    msg: str

    def __init__(self, events: List[Any]) -> None:
        self.msg = f'No primary event (events ={events})'


def ts_to_time(timestamp: Union[int, float]) -> str:
    return f'{datetime.datetime.utcfromtimestamp(int(timestamp)).isoformat("T")}Z'


def time_to_ts(time: str) -> int:
    if time.endswith('Z'):
        time = f'{time[:-1]}+00:00'
    return int(datetime.datetime.fromisoformat(time).timestamp())


class GoogleReportConnector(Connector, ABC):
    _ignored_action: Sequence[str] = ()
    _event_parameters: Sequence[str] = ()
    application: str

    @classmethod
    def validate_config(cls, conf: Any) -> None:
        if not isinstance(conf, dict):
            raise TypeError('config is not dict')
        for k in (
            'token_file',
            'admin_email',
            'application',
        ):
            if k not in conf:
                raise KeyError(f'"{k}" not in config')

    def __init__(self, source: ActivitySource):
        super().__init__(source)
        token_file: str = source.config['token_file']  # type: ignore
        admin_email: str = source.config['admin_email']  # type: ignore
        application: str = source.config['application']  # type: ignore
        with open(token_file, encoding='utf8') as f:
            keys = json.load(fp=f)
        self.creds = ServiceAccountCreds(**keys, scopes=SCOPES, subject=admin_email)
        self.application = application

    @abstractmethod
    def create_link(self, parameters: Dict[str, Any]) -> str:
        pass

    @abstractmethod
    def create_target_id(self, parameters: Dict[str, Any]) -> str:
        pass

    def create_time(self, parameters: Dict[str, Any]) -> datetime.datetime:
        return datetime.datetime.utcfromtimestamp(time_to_ts(parameters['time']))

    def create_action(self, parameters: Dict[str, Any]) -> str:
        return parameters['name']  # type: ignore

    # pylint: disable-next=unused-argument
    def create_duration(self, parameters: Dict[str, Any]) -> int:
        return 0

    async def get_objects(self, req_filter: Dict[str, str]) -> Any:
        async with Aiogoogle(service_account_creds=self.creds) as aiogoogle:
            endpoint = await aiogoogle.discover('admin', 'reports_v1')
            req = endpoint.activities.list(**req_filter)
            while req:
                response = await aiogoogle.as_service_account(req, full_res=True)
                for res in response.content.get('items', []):
                    yield res
                req = response.next_page()

    async def get_activities(
        self, start: float, end: float, aliases: Dict[str, int]
    ) -> List[Activity]:
        results = []
        req_filter = {
            'applicationName': self.application,
            'startTime': ts_to_time(start),
            'endTime': ts_to_time(end),
            'userKey': 'all',
        }
        async for res in self.get_objects(req_filter):
            if 'email' not in res['actor']:
                continue
            if not (employee_id := aliases.get(res['actor']['email'])):
                continue
            try:
                res_info = self.parse_report(res)
            except NoPrimaryEventException as err:
                print(f'{self.source.name}: {err.msg}')
                continue
            if res_info['name'] in self._ignored_action:
                continue
            results.append(
                Activity(
                    employee_id=employee_id,
                    source_id=self.source.id,
                    action=self.create_action(res_info),
                    time=self.create_time(res_info),
                    target_id=self.create_target_id(res_info),
                    target_link=self.create_link(res_info),
                    target_name='',
                    duration=self.create_duration(res_info),
                )
            )
        print(f'{self.source.name}: loaded {len(results)} activity')
        return results

    @classmethod
    def parse_report(cls, report: Dict[str, Any]) -> Dict[str, Any]:
        events = report['events']
        primary_event = len(events) == 1
        for e in events:
            for p in e['parameters']:
                if p['name'] != 'primary_event':
                    continue
                primary_event = p['boolValue']
                break
            if primary_event:
                result = {
                    'time': report['id']['time'],
                    'type': e['type'],
                    'name': e['name'],
                }
                for p in e['parameters']:
                    if p['name'] not in cls._event_parameters:
                        continue
                    if 'value' in p:
                        result[p['name']] = p['value']
                    elif 'intValue' in p:
                        result[p['name']] = int(p['intValue'])
                    elif 'boolValue' in p:
                        result[p['name']] = p['boolValue'] == 'true'
                return result
        raise NoPrimaryEventException(events)

    async def get_users(self, employees: Sequence[m.Employee]) -> Dict[int, str]:
        return {emp.id: emp.email for emp in employees}
