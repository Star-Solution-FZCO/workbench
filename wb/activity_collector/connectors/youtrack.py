import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Sequence, Union
from urllib.parse import quote, urljoin

import aiohttp

import wb.models as m
from wb.models.activity import Activity, ActivitySource

from .base import Connector, DoneTask

__all__ = ('YoutrackConnector',)


YOUTRACK_TIMEOUT = 60


async def json_request(url: str, token: str, base: str) -> Union[Dict, List]:
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
    url = urljoin(base, url)
    try:
        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.get(
                url, ssl=False, timeout=YOUTRACK_TIMEOUT
            ) as response:
                return json.loads(await response.read())  # type: ignore
    except Exception as err:  # pylint: disable=broad-exception-caught
        print(f'{err}')
        logging.error(f'request to {url} failed with error={err}')
        return []


async def get_objects(
    url: str, token: str, base: str, load_per_request: int = 1000
) -> Any:
    start = 0
    while True:
        resp = await json_request(
            url + f'&$skip={start * load_per_request}&$top={load_per_request}',
            token,
            base,
        )
        if not resp:
            return
        for res in resp:
            yield res
        start += 1


class IssueActivity:
    obj_id: str
    timestamp: int
    added: List[Dict[str, str]]
    target_member: Optional[str]
    removed: List[Dict[str, str]]
    changed_field: Optional[str]
    author: str
    summary: str | None

    def __init__(self, data: Dict[str, Any]):
        target_ = data['target']
        self.obj_id = target_.get('idReadable', target_['id'])
        self._data: dict = {}
        self.changed_field = data['field'].get('presentation', None)
        self.target_member = data['targetMember']
        self.added = data['added']
        self.removed = data['removed']
        self.timestamp = data['timestamp']
        if self.changed_field != 'comments':
            self.issue = self.obj_id
            self.summary = target_.get('summary')
        else:
            self.issue = target_['issue']['idReadable']
            self.summary = target_.get('issue', {}).get('summary')
        self.author = data['author']['login']


class YoutrackConnector(Connector):
    __url: str
    __token: str

    @classmethod
    def validate_config(cls, conf: Any) -> None:
        if not isinstance(conf, dict):
            raise TypeError('config is not dict')
        for k in (
            'url',
            'token',
        ):
            if k not in conf:
                raise KeyError(f'"{k}" not in config')

    def __init__(self, source: ActivitySource):
        super().__init__(source)
        self.__url = source.config.get('url')  # type: ignore
        self.__token = source.config.get('token')  # type: ignore

    async def get_activities(
        self, start: float, end: float, aliases: Dict[str, int]
    ) -> List[Activity]:
        results: List[Activity] = []
        start_ts = int(start * 1000)
        end_ts = int(end * 1000)
        url = (
            f'/api/activities?fields=timestamp,'
            f'added(name,presentation,login,isResolved),'
            'targetMember,'
            f'removed(name,presentation,login,isResolved),target(id,idReadable,'
            f'issue(idReadable,project(shortName),summary),summary),'
            f'field(presentation),'
            f'author(login)'
            f'&categories=IssueCreatedCategory,CommentTextCategory,CustomFieldCategory,CommentsCategory&'
            f'start={start_ts}&'
            f'end={end_ts}'
        )
        async for r in get_objects(url, self.__token, self.__url):
            issue_activity = IssueActivity(r)
            if not (employee_id := aliases.get(issue_activity.author)):
                continue
            if issue_activity.changed_field == 'created':
                results.append(
                    Activity(
                        employee_id=employee_id,
                        source_id=self.source.id,
                        action='CREATED',
                        time=datetime.utcfromtimestamp(
                            int(issue_activity.timestamp / 1000)
                        ),
                        target_id=issue_activity.obj_id,
                        target_link=f'{self.__url}/issue/{issue_activity.obj_id}',
                        target_name=issue_activity.summary,
                        meta={'youtrack': {'issue': {'resolved': False}}},
                    )
                )
            if (
                issue_activity.changed_field == 'State'
                and issue_activity.added
                and issue_activity.added[0].get('name')
                in (
                    'In Progress',
                    'Paused',
                )
            ):
                results.append(
                    Activity(
                        employee_id=employee_id,
                        source_id=self.source.id,
                        action=issue_activity.added[0]['name'].upper(),
                        time=datetime.utcfromtimestamp(
                            int(issue_activity.timestamp / 1000)
                        ),
                        target_id=issue_activity.obj_id,
                        target_link=f'{self.__url}/issue/{issue_activity.obj_id}',
                        target_name=issue_activity.summary,
                        meta={'youtrack': {'issue': {'resolved': False}}},
                    )
                )
            if (
                issue_activity.changed_field == 'State'
                and (
                    not issue_activity.removed
                    or not issue_activity.removed[0].get('isResolved')
                )
                and issue_activity.added
                and issue_activity.added[0].get('isResolved')
            ):
                results.append(
                    Activity(
                        employee_id=employee_id,
                        source_id=self.source.id,
                        action=issue_activity.added[0]['name'].upper(),
                        time=datetime.utcfromtimestamp(
                            int(issue_activity.timestamp / 1000)
                        ),
                        target_id=issue_activity.obj_id,
                        target_link=f'{self.__url}/issue/{issue_activity.obj_id}',
                        target_name=issue_activity.summary,
                        meta={'youtrack': {'issue': {'resolved': True}}},
                    )
                )
            if issue_activity.changed_field == 'comments':
                results.append(
                    Activity(
                        employee_id=employee_id,
                        source_id=self.source.id,
                        action='ADD COMMENT',
                        time=datetime.utcfromtimestamp(
                            int(issue_activity.timestamp / 1000)
                        ),
                        target_id=issue_activity.issue,
                        target_link=f'{self.__url}/issue/{issue_activity.issue}#focus=Comments-{issue_activity.obj_id}.0-0',
                        target_name=issue_activity.summary,
                    )
                )
        print(f'{self.source.name}: loaded {len(results)} activity')
        return results

    async def get_users(self, employees: Sequence[m.Employee]) -> Dict[int, str]:
        employees_ids_by_email = {emp.email: emp.id for emp in employees}
        url = '/api/users?fields=name,login,email'
        response = [
            obj
            async for obj in get_objects(url, self.__token, self.__url)
            if 'email' in obj
        ]
        return {
            employees_ids_by_email[u['email']]: u['login']
            for u in response
            if u['email'] in employees_ids_by_email
        }

    async def get_done_tasks(
        self, start: float, end: float, aliases: dict[str, int]
    ) -> dict[int, list[DoneTask]]:
        start_ = datetime.utcfromtimestamp(start)
        end_ = datetime.utcfromtimestamp(end)
        query = f'resolved date: {{{start_.strftime("%Y-%m-%dT%H:%M:%S")}}} .. {{{end_.strftime("%Y-%m-%dT%H:%M:%S")}}}'
        url = (
            '/api/issues?fields=idReadable,resolved,'
            'customFields(name,value(login))'
            '&customFields=assignee'
            f'&query={quote(query)}'
        )

        results: dict[int, list[DoneTask]] = {}

        def _add_done_task(assignee_login: str | None, task_: DoneTask) -> None:
            if not assignee_login:
                return
            if not (emp_id := aliases.get(assignee_login)):
                return
            if task_.time < start_ or task_.time >= end_:
                return
            task_.employee_id = emp_id
            if task_.employee_id not in results:
                results[task_.employee_id] = []
            results[task_.employee_id].append(task_)

        async for r in get_objects(url, self.__token, self.__url):
            custom_fields = _parse_custom_fields(r.get('customFields', []))
            if not (assignee_value := custom_fields.get('Assignee', {}).get('value')):
                continue
            _add_done_task(
                assignee_value.get('login'),
                DoneTask(
                    employee_id=0,
                    source_id=self.source.id,
                    time=datetime.utcfromtimestamp(r['resolved'] / 1000),
                    task_id=r['idReadable'],
                    task_type='RESOLVED_ISSUE',
                    task_name=r.get('summary'),
                    task_link=f'{self.__url}/issue/{r["idReadable"]}',
                ),
            )
        return results


def _parse_custom_fields(custom_fields: list[dict]) -> dict:
    return {cf['name']: cf for cf in custom_fields}
