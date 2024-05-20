import json
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Sequence
from urllib.parse import urljoin

import aiohttp

import wb.models as m
from wb.models.activity import Activity, ActivitySource

from .base import Connector, DoneTask

__all__ = ('GerritPresenceConnector',)


GERRIT_MAGIC_JSON_PREFIX = b")]}'\n"
GERRIT_AUTH_SUFFIX = '/a'
COMMENTS_PATTERN = re.compile(r'^\((\d+) comments?\)$')


def _fill_change_meta(change: dict) -> dict:
    return {
        'gerrit': {
            'change': {
                'id': change['id'],
                'change_id': change.get('change_id'),
                'submission_id': change.get('submission_id'),
                'project': change.get('project'),
                'branch': change.get('branch'),
                'subject': change.get('subject'),
                'insertions': change.get('insertions'),
                'deletions': change.get('deletions'),
            }
        }
    }


def _create_change_name(change: dict) -> str:
    return ': '.join(
        filter(
            lambda x: x,
            [
                change.get('project', ''),
                change.get('branch', ''),
                change.get('subject', ''),
            ],
        )
    )


class GerritRestAPI:
    base: str

    def __init__(self, base: str, username: str, password: str):
        self._auth = aiohttp.BasicAuth(username, password)
        self.base = base

    async def get(self, endpoint: str) -> Any:
        url = urljoin(self.base, f'{GERRIT_AUTH_SUFFIX}{endpoint}')
        headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}
        try:
            async with aiohttp.ClientSession(
                headers=headers, auth=self._auth
            ) as session:
                async with session.get(url, ssl=False) as response:
                    data = await response.read()
                    if data.startswith(GERRIT_MAGIC_JSON_PREFIX):
                        data = data[len(GERRIT_MAGIC_JSON_PREFIX) :]
                    return json.loads(data)
        except Exception as err:  # pylint: disable=broad-exception-caught
            print(f'{err}')
            logging.error(f'request to {url} failed with error={err}')
            return []

    async def _get_list_response(
        self, endpoint: str, more_field: str, start: int = 0
    ) -> list:
        if start:
            endpoint += f'&S={start}'
        res = await self.get(endpoint)
        if not res:
            return []
        if res[-1].get(more_field):
            res.extend(
                await self._get_list_response(
                    endpoint, more_field=more_field, start=start + len(res)
                )
            )
        return res  # type: ignore

    async def get_changes_list(self, endpoint: str) -> list:
        return await self._get_list_response(endpoint, more_field='_more_changes')

    async def get_accounts_list(self) -> List[Dict[str, Any]]:
        endpoint = '/accounts/?q=is:active&o=DETAILS'
        return await self._get_list_response(endpoint, more_field='_more_accounts')


def in_range(start: float, end: float, compare_time: datetime) -> bool:
    return (
        datetime.utcfromtimestamp(start)
        <= compare_time
        <= datetime.utcfromtimestamp(end)
    )


def time_converter(time_str: str) -> datetime:
    utc_ts = datetime.strptime(
        f'{time_str.split(".")[0]} +0000', '%Y-%m-%d %H:%M:%S %z'
    ).timestamp()
    return datetime.utcfromtimestamp(utc_ts)


def _parse_messages_comments(msgs: list[dict]) -> dict[int, list[datetime, int, int]]:
    results = {}
    for msg in msgs:
        author = msg.get('author', {}).get('_account_id')
        if not author:
            continue
        if author not in results:
            results[author] = []
        comment_parts = filter(
            bool,
            map(COMMENTS_PATTERN.fullmatch, msg.get('message', '').split('\n\n')),
        )
        for p in comment_parts:
            results[author].append(
                (
                    datetime.fromisoformat(msg['date']),
                    int(p.groups()[0]),
                    msg['_revision_number'],
                )
            )
    return results


def _parse_revisions(revs: dict[str, dict]) -> dict[int, tuple[datetime, int, bool]]:
    results = {}
    for rev in revs.values():
        results[rev['_number']] = (
            datetime.fromisoformat(rev['created']),
            rev['uploader']['_account_id'],
            'SERVICE_USER' in rev['uploader'].get('tags', []),
        )
    return results


class GerritPresenceConnector(Connector):
    __url: str
    __rest: GerritRestAPI

    @classmethod
    def validate_config(cls, conf: Any) -> None:
        if not isinstance(conf, dict):
            raise TypeError('config is not dict')
        for k in (
            'url',
            'pass',
            'user',
        ):
            if k not in conf:
                raise KeyError(f'"{k}" is missing')

    def __init__(self, source: ActivitySource):
        super().__init__(source)
        self.__url = source.config.get('url')  # type: ignore
        self.__rest = GerritRestAPI(
            self.__url, source.config.get('user'), source.config.get('pass')
        )  # type: ignore

    async def get_activities(
        self, start: float, end: float, aliases: Dict[str, int]
    ) -> List[Activity]:
        # pylint: disable=too-many-locals, too-many-branches
        results: List[Activity] = []
        try:
            changes = await self.__rest.get_changes_list(
                f'/changes/?q=after:"{datetime.utcfromtimestamp(start).strftime("%Y-%m-%d %H:%M:%S")}"'
                f'&o=ALL_REVISIONS&o=DETAILED_LABELS&o=DETAILED_ACCOUNTS&o=MESSAGES'
            )
        except Exception:  # pylint: disable=broad-exception-caught
            return []
        for change in changes:
            created_change_time = time_converter(change['created'])
            if in_range(start, end, created_change_time):
                if employee_id := aliases.get(str(change['owner']['_account_id'])):
                    results.append(
                        Activity(
                            employee_id=employee_id,
                            source_id=self.source.id,
                            action='NEW',
                            time=created_change_time,
                            target_id=change['id'],
                            target_link=f'{self.__url}/#/q/{change["id"].split("~")[-1]}',
                            target_name=_create_change_name(change),
                            meta=_fill_change_meta(change),
                        )
                    )
            if change.get('submitted'):
                submitted_change_time = time_converter(change['submitted'])
                if in_range(start, end, submitted_change_time):
                    cur_revision = change['current_revision']
                    if employee_id := aliases.get(
                        str(change['submitter']['_account_id'])
                    ):
                        target_name = _create_change_name(change)
                        if (
                            last_revision_author := change['revisions'][
                                cur_revision
                            ].get('uploader', {})
                        ) and last_revision_author.get('_account_id') != change[
                            'submitter'
                        ]['_account_id']:
                            target_name += (
                                f' (uploader {last_revision_author.get("email", "")})'
                            )
                        results.append(
                            Activity(
                                employee_id=employee_id,
                                source_id=self.source.id,
                                action=change['status'],
                                time=submitted_change_time,
                                target_id=change['id'],
                                target_link=f'{self.__url}/#/q/{change["id"].split("~")[-1]}',
                                target_name=target_name,
                                meta=_fill_change_meta(change),
                            )
                        )
                    change['revisions'].pop(cur_revision)

            revisions = change['revisions']
            for rev in revisions:
                rev_created_time = time_converter(revisions[rev]['created'])
                if (
                    in_range(start, end, rev_created_time)
                    and revisions[rev]['_number'] != 1
                ):
                    if employee_id := aliases.get(
                        str(revisions[rev]['uploader']['_account_id'])
                    ):
                        results.append(
                            Activity(
                                employee_id=employee_id,
                                source_id=self.source.id,
                                action=f'patchset {revisions[rev]["kind"]} - {revisions[rev]["_number"]}',
                                time=rev_created_time,
                                target_id=change['id'],
                                target_link=f'{self.__url}/#/q/{change["id"].split("~")[-1]}',
                                target_name=_create_change_name(change),
                                meta=_fill_change_meta(change),
                            )
                        )
            if change.get('total_comment_count', 0):
                results.extend(await self._get_comments(change, start, end, aliases))
            messages = change.get('messages', [])
            for message in messages:
                message_time = time_converter(message['date'])
                if re.match(r'^.*Code-Review\+2', message['message']) and in_range(
                    start, end, message_time
                ):
                    if employee_id := aliases.get(
                        str(message['author']['_account_id'])
                    ):
                        results.append(
                            Activity(
                                employee_id=employee_id,
                                source_id=self.source.id,
                                action='code review +2',
                                time=message_time,
                                target_id=change['id'],
                                target_link=f'{self.__url}/#/q/{change["id"].split("~")[-1]}',
                                target_name=_create_change_name(change),
                                meta=_fill_change_meta(change),
                            )
                        )
        print(f'{self.source.name}: loaded {len(results)} activity')
        return results

    async def _get_comments(
        self, change: Any, start: float, end: float, aliases: Dict[str, int]
    ) -> List[Activity]:
        results: List[Activity] = []
        try:
            comments = await self.__rest.get(f'/changes/{change["id"]}/comments')
        except Exception:  # pylint: disable=broad-exception-caught
            return []
        for comment_file in comments:
            for comment in comments[comment_file]:
                comment_time = time_converter(comment['updated'])
                if in_range(start, end, comment_time):
                    if employee_id := aliases.get(
                        str(comment['author']['_account_id'])
                    ):
                        results.append(
                            Activity(
                                employee_id=employee_id,
                                source_id=self.source.id,
                                action='comment',
                                time=comment_time,
                                target_id=change['id'],
                                target_link=f'{self.__url}/#/q/{change["id"].split("~")[-1]}',
                                target_name=_create_change_name(change),
                                meta=_fill_change_meta(change),
                            )
                        )
        return results

    async def get_users(self, employees: Sequence[m.Employee]) -> Dict[int, str]:
        employees_ids_by_email = {emp.email: emp.id for emp in employees}
        employees_ids_by_acc = {emp.account: emp.id for emp in employees}
        results: Dict[int, str] = {}
        response = await self.__rest.get_accounts_list()
        for rec in response:
            if not (g_id := rec.get('_account_id')):
                continue
            if (g_email := rec.get('email')) and g_email in employees_ids_by_email:
                results[employees_ids_by_email[g_email]] = str(g_id)
                continue
            if (g_account := rec.get('username')) and g_account in employees_ids_by_acc:
                results[employees_ids_by_acc[g_account]] = str(g_id)
                continue
        return results

    async def get_done_tasks(
        self, start: float, end: float, aliases: dict[str, int]
    ) -> dict[int, list[DoneTask]]:
        # pylint: disable=too-many-locals
        start_ = datetime.utcfromtimestamp(start)
        end_ = datetime.utcfromtimestamp(end)
        res = await self.__rest.get_changes_list(
            f'/changes/?q=after:"{start_.strftime("%Y-%m-%d %H:%M:%S")}" branch:master&o=ALL_REVISIONS&o=DETAILED_LABELS&o=DETAILED_ACCOUNTS&o=MESSAGES'
        )
        results = {}

        def _add_done_task(author_id_: int, task_: DoneTask) -> None:
            if not (emp_id := aliases.get(str(author_id_))):
                return
            task_.employee_id = emp_id
            if task_.employee_id not in results:
                results[task_.employee_id] = []
            results[task_.employee_id].append(task_)

        for r in res:
            parsed_comments = _parse_messages_comments(r.get('messages', []))
            parsed_revisions = _parse_revisions(r.get('revisions', {}))
            not_self_comments = {}
            for author_id, comments in parsed_comments.items():
                for comment in comments:
                    if (
                        author_id != parsed_revisions[comment[2]][1]
                        and comment[0] >= start_
                        and comment[0] < end_
                    ):
                        if author_id not in not_self_comments:
                            not_self_comments[author_id] = []
                        not_self_comments[author_id].append(comment)
            last_revision = max(
                [rev for rev, pr in parsed_revisions.items() if not pr[2]] or [0]
            )
            if (
                r['status'] == 'MERGED'
                and last_revision
                and parsed_revisions[last_revision][0] >= start_
                and parsed_revisions[last_revision][0] < end_
            ):
                _add_done_task(
                    parsed_revisions[last_revision][1],
                    DoneTask(
                        employee_id=0,
                        source_id=self.source.id,
                        time=parsed_revisions[last_revision][0],
                        task_id=r['id'],
                        task_type='MERGED_COMMIT',
                        task_name=r['subject'],
                        task_link=f'{self.__url}/#/q/{r["id"].split("~")[-1]}',
                    ),
                )
            for author_id, comments in not_self_comments.items():
                for c in comments:
                    for _ in range(c[1]):
                        _add_done_task(
                            author_id,
                            DoneTask(
                                employee_id=0,
                                source_id=self.source.id,
                                time=c[0],
                                task_id=r['id'],
                                task_type='COMMENT',
                                task_name=r['subject'],
                                task_link=f'{self.__url}/#/q/{r["id"].split("~")[-1]}',
                            ),
                        )
        return results
