import asyncio
from datetime import datetime, timedelta

import sqlalchemy as sa

import wb.models as m
from wb.celery_app import celery_app
from wb.config import CONFIG
from wb.db import multithreading_safe_async_session
from wb.services.youtrack.youtrack import _AdminYoutrackProcessor as YoutrackProcessor

__all__ = ('task_weekly_collect_issues',)


TIMEOUT = 60


def fetch_issues(projects: list[str]) -> list:
    youtrack_processor = YoutrackProcessor(
        CONFIG.YOUTRACK_URL, CONFIG.YOUTRACK_API_TOKEN, TIMEOUT, CONFIG.YOUTRACK_SCOPE
    )
    query = 'Assignee: -Unassigned Due Date: {minus 1w} .. {plus 1w}'
    if projects:
        query = f'in: {",".join(projects)}' + ' ' + query
    fields = [
        'id',
        'idReadable',
        'summary',
        'resolved',
        'created',
        'customFields(name,value(name,login,email))',
    ]
    issues = youtrack_processor.list_issue(query=query, fields=fields)
    return issues


def _get_issue_assignee(custom_fields: dict) -> tuple[str, str]:
    for field in custom_fields:
        if field.get('name', '') == 'Assignee':
            value = field.get('value')
            return value.get('login'), value.get('email')
    raise ValueError('Issue has no Assignee field')


def _get_field_value(custom_fields, field_name):
    for field in custom_fields:
        if field['name'] == field_name:
            value = field['value']
            if not value:
                return None
            if isinstance(value, int):
                return value
            if isinstance(value, list):
                return [item.get('name') for item in value if item.get('name')]
            return value.get('name')
    return None


def get_last_week_monday():
    current_time = datetime.utcnow()
    start_of_this_week = current_time - timedelta(days=current_time.weekday())
    start_of_last_week = start_of_this_week - timedelta(weeks=1)
    return start_of_last_week


async def weekly_collect_issues() -> None:
    async with multithreading_safe_async_session() as session:
        settings = await session.scalar(sa.select(m.IssuesSettings))
        if not settings:
            return
        projects = settings.projects
        last_week_monday = get_last_week_monday()
        issues = fetch_issues(projects)
        for issue_data in issues:
            custom_fields = issue_data['customFields']
            try:
                _, assignee_email = _get_issue_assignee(custom_fields)
            except ValueError:
                continue
            assignee = await session.scalar(
                sa.select(m.Employee).where(m.Employee.email == assignee_email)
            )
            if not assignee:
                continue
            existed_issue = await session.scalar(
                sa.select(m.Issue).where(m.Issue.issue_id == issue_data['id'])
            )
            created = datetime.fromtimestamp(issue_data['created'] / 1000)
            _due_date = _get_field_value(custom_fields, 'Due Date')
            due_date = datetime.fromtimestamp(_due_date / 1000) if _due_date else None
            if existed_issue and issue_data['resolved']:
                existed_issue.resolved = bool(issue_data['resolved'])
            else:
                issue = m.Issue(
                    issue_id=issue_data['idReadable'],
                    subject=issue_data['summary'],
                    assignee_id=assignee.id,
                    resolved=bool(issue_data['resolved']),
                    severity=_get_field_value(custom_fields, 'Severity'),
                    priority=_get_field_value(custom_fields, 'Priority'),
                    sprints=_get_field_value(custom_fields, 'Sprint'),
                    created=created,
                    unplanned=created >= last_week_monday,
                    due_date=due_date,
                )
                session.add(issue)
        await session.commit()


@celery_app.task(name='weekly_collect_issues')
def task_weekly_collect_issues() -> None:
    if not CONFIG.YOUTRACK_URL:
        return
    print('start collect issues')
    asyncio.run(weekly_collect_issues())
    print('end collect issues')
