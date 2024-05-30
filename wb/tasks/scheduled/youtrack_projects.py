import asyncio
import json
from typing import Any, Dict, List
from urllib.error import HTTPError
from urllib.parse import quote, urljoin
from urllib.request import Request, urlopen

import sqlalchemy as sa

import wb.models as m
from wb.celery_app import celery_app
from wb.config import CONFIG
from wb.db import multithreading_safe_async_session

__all__ = ('task_sync_youtrack_projects',)


def _send_youtrack_request(url: str, method: str = 'GET') -> Any:
    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {CONFIG.YOUTRACK_API_TOKEN}',
    }
    req = Request(url, headers=headers, method=method.upper())
    try:
        with urlopen(req) as response:
            return json.loads(response.read())
    except HTTPError as err:
        print(f'{url}: {err.status}: {str(err.read())}')
        return []


def _get_issue_assignee(fields: dict) -> tuple[str, str]:
    for f in fields:
        if f.get('name', '') == 'Assignee':
            value = f.get('value')
            return value.get('login'), value.get('email')
    raise ValueError('Issue has no Assignee field')


async def _update_projects(projects: Dict[str, List[str]]) -> None:
    async with multithreading_safe_async_session() as session:
        for email, prjts in projects.items():
            if not (
                user := await session.scalar(
                    sa.select(m.Employee).where(m.Employee.email == email)
                )
            ):
                continue
            if set(user.projects) == set(prjts):
                continue
            user.projects = sorted(prjts)
        await session.commit()


@celery_app.task(name='sync_youtrack_projects')
def task_sync_youtrack_projects() -> None:
    if not CONFIG.YOUTRACK_URL:
        return
    print('start sync youtrack projects')
    query = 'Assignee: -Unassigned resolved date: {minus 90d} .. Today'
    fields = ['id', 'project(name)', 'customFields(name,value(login,email))']
    url = f'/api/issues?query={quote(query)}&fields={",".join(fields)}'
    issues = _send_youtrack_request(urljoin(CONFIG.YOUTRACK_URL, url), method='GET')
    employees: Dict[str, Dict[str, Any]] = {}
    projects_per_email: Dict[str, List[str]] = {}
    for issue in issues:
        try:
            login, email = _get_issue_assignee(issue.get('customFields'))
        except ValueError:
            continue
        if login not in employees:
            if not email:
                continue
            employees[login] = {'email': email, 'projects': {}}
        project = issue.get('project').get('name')
        if project not in employees[login]['projects']:
            employees[login]['projects'][project] = 0
        employees[login]['projects'][project] += 1
    for data in employees.values():
        projects_per_email[data['email']] = list(
            map(str.strip, data.get('projects', {}).keys())
        )
    asyncio.run(_update_projects(projects_per_email))
    print('end sync youtrack projects')
