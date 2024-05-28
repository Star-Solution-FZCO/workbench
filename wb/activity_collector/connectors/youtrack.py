import asyncio
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Sequence, Union
from urllib.parse import quote, urljoin

import aiohttp

import wb.models as m
from shared_utils.dateutils import month_range
from wb.log import log
from wb.models.activity import Activity, ActivitySource
from wb.utils.cache import get_key_builder_exclude_args, lru_cache

from .base import Connector, DoneTask

__all__ = ('YoutrackConnector',)


YOUTRACK_TIMEOUT = 60
UNCACHED_PERIOD_DAYS = 2 * 30


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
        self.author = data['author']['id']


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
            f'added(name,presentation,id,isResolved),'
            'targetMember,'
            f'removed(name,presentation,id,isResolved),target(id,idReadable,'
            f'issue(idReadable,project(shortName),summary),summary),'
            f'field(presentation),'
            f'author(id)'
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
        url = '/api/users?fields=id,email'
        response = [
            obj
            async for obj in get_objects(url, self.__token, self.__url)
            if 'email' in obj
        ]
        return {
            employees_ids_by_email[u['email']]: u['id']
            for u in response
            if u['email'] in employees_ids_by_email
        }

    async def _get_resolved_issues(self, start: float, end: float) -> list:
        start_ = datetime.utcfromtimestamp(start)
        end_ = datetime.utcfromtimestamp(end)
        query = f'resolved date: {{{start_.strftime("%Y-%m-%dT%H:%M:%S")}}} .. {{{end_.strftime("%Y-%m-%dT%H:%M:%S")}}}'
        url = (
            '/api/issues?fields=idReadable,resolved,'
            'customFields(name,value(id))'
            '&customFields=assignee'
            f'&query={quote(query)}'
        )
        return [r async for r in get_objects(url, self.__token, self.__url)]

    async def get_done_tasks(
        self, start: float, end: float, aliases: dict[str, int]
    ) -> dict[int, list[DoneTask]]:
        # pylint: disable=too-many-locals
        log.debug(f'[{self.source.name}] getting done tasks from {start} to {end}')
        if start > end:
            return {}
        issues = {}
        start_ = datetime.utcfromtimestamp(start)
        end_ = datetime.utcfromtimestamp(end)
        cached_end = datetime.utcnow() - timedelta(days=UNCACHED_PERIOD_DAYS)
        log.debug(f'[{self.source.name}] cached_end={cached_end}')
        tasks = []
        if cached_end >= start_:
            tasks.extend(
                [
                    _get_resolved_issues_by_month(month, year, self)
                    for year, month in month_range(
                        (start_.year, start_.month), (cached_end.year, cached_end.month)
                    )
                ]
            )
        if max(cached_end, start_) < end_:
            uncached_start_ts = (
                max(cached_end, start_).replace(tzinfo=timezone.utc).timestamp()
            )
            tasks.append(self._get_resolved_issues(uncached_start_ts, end))

        for idx, res in enumerate(await asyncio.gather(*tasks)):
            try:
                log.debug(f'[{self.source.name}] got {len(res)} issues from {idx} task')
                issues.update(
                    {
                        c['idReadable']: c
                        for c in res
                        if start <= c['resolved'] / 1000 <= end
                    }
                )
            except Exception as err:
                log.error(
                    f'[{self.source.name}] error while processing task {idx}: {err}'
                )
                raise
        log.debug(f'[{self.source.name}] got {len(issues)} issues')

        results: dict[int, list[DoneTask]] = {}

        def _add_done_task(assignee_id: str | None, task_: DoneTask) -> None:
            if not assignee_id:
                return
            if not (emp_id := aliases.get(assignee_id)):
                return
            if task_.time < start_ or task_.time >= end_:
                return
            task_.employee_id = emp_id
            if task_.employee_id not in results:
                results[task_.employee_id] = []
            results[task_.employee_id].append(task_)

        for r in issues.values():
            custom_fields = _parse_custom_fields(r.get('customFields', []))
            if not (assignee_value := custom_fields.get('Assignee', {}).get('value')):
                continue
            _add_done_task(
                assignee_value.get('id'),
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
        log.debug(f'[{self.source.name}] got {len(results)} done tasks')
        return results


def _parse_custom_fields(custom_fields: list[dict]) -> dict:
    return {cf['name']: cf for cf in custom_fields}


@lru_cache(
    ttl=UNCACHED_PERIOD_DAYS * 24 * 60 * 60,
    key_builder=get_key_builder_exclude_args(('connector',)),
)
async def _get_resolved_issues_by_month(
    month: int, year: int, connector: YoutrackConnector
) -> list:
    start = datetime(year, month, 1, tzinfo=timezone.utc).timestamp()
    next_month, next_year = (month + 1, year) if month < 12 else (1, year + 1)
    end = datetime(next_year, next_month, 1, tzinfo=timezone.utc).timestamp() - 0.000001
    return await connector._get_resolved_issues(start, end)  # pylint: disable=protected-access
