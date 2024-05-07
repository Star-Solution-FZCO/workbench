from typing import Any

from wb.schemas import RequestQueryParams


def make_yt_query(
    projects: list[str],
    params: RequestQueryParams,
) -> str:
    query = ' '.join([f'in: {prj}' for prj in projects])
    involvement = ''
    state = ''
    subsystem = ''
    search = ''
    if params.status:
        if params.status == 'Open':
            state = '#Unresolved'
        if params.status == 'Closed':
            state = '#Resolved'
    if params.requester:
        if params.requester == 'me':
            involvement = 'created by: me'
        if params.requester == 'participant':
            involvement = '(Assignee: me or commented: me or updated by: me)'
    if params.service:
        subsystem = f'Service: {{{params.service}}}'
    if params.search:
        search = f'summary: {params.search} or description: {params.search} or comments: {params.search}'
    filters = [state, involvement, subsystem, search]
    user_filters = [f for f in filters if f != '']
    if len(user_filters) > 0:
        query += ' and ' + ' and '.join(user_filters)
    query += ' and sort by: updated desc and Channel: WB'
    return query


def make_yt_issue_comment_text(fields: dict[bytes, Any]) -> str:
    text = ''
    for key, value in fields.items():
        label = ' '.join(key.decode().split('_')).capitalize()
        section = f'**{label}**\n{value}\n'
        text += section
    return text
