import json
import re
import time
from hashlib import md5
from typing import Any, Generator, Pattern, cast
from urllib.error import HTTPError

import sqlalchemy as sa
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.config import CONFIG

from .types import (
    CustomFieldListT,
    FieldsT,
    IssueAttachmentT,
    IssueCommentT,
    IssuesCountT,
    IssueT,
    JsonT,
    TagsT,
)
from .utils import (
    NAME,
    TIMEOUT,
    MultiPartForm,
    YoutrackException,
    YoutrackTooManyAccounts,
    YoutrackUserNotFound,
    base_request,
    build_url,
    json_request,
    load_generator,
    load_with_key_generator,
    make_args,
    make_fields,
)

TAKE_ID_FIELD = '_take_id'


__all__ = ('YoutrackProcessor',)


def generate_token_name() -> str:
    uuid_ = md5(str(time.time()).encode(), usedforsecurity=False).hexdigest()
    return f'{CONFIG.YOUTRACK_USER_TOKEN_PREFIX}-{uuid_}'


async def create_youtrack_access_token_by_login(
    processor: '_AdminYoutrackProcessor', session: AsyncSession, login: str
) -> m.YoutrackAccessToken:
    name, token = processor.create_token_by_login(login)
    new_token = m.YoutrackAccessToken(name=name, token=token)
    session.add(new_token)
    await session.commit()
    return new_token


async def get_youtrack_account(
    session: AsyncSession, user: 'm.Employee'
) -> m.YoutrackAccount | None:
    q = sa.select(m.YoutrackAccount).where(m.YoutrackAccount.employee_id == user.id)
    obj: m.YoutrackAccount | None = await session.scalar(q)
    return obj


async def get_token_from_user(
    processor: '_AdminYoutrackProcessor', session: AsyncSession, user: 'm.Employee'
) -> str | None:
    account = await get_youtrack_account(session=session, user=user)
    if account:
        token_obj = account.token
        if token_obj and token_obj.token:
            return cast(str, token_obj.token)
        if not account.login:
            return None
        # noinspection PyTypeChecker
        new_token = await create_youtrack_access_token_by_login(
            processor=processor, session=session, login=account.login
        )
        account.token_id = new_token.id
        if session.is_modified(account):
            await session.commit()
        return cast(str, new_token.token)
    _user = processor.get_user_by_email(
        user.email, fields=['id', 'login', 'email', 'banned'], with_banned=True
    )
    if not _user:
        return None
    name, token = processor.create_token(
        _user['id'], generate_token_name(), fields=['name', 'token']
    )
    new_token_obj = m.YoutrackAccessToken(name=name, token=token)
    session.add(new_token_obj)
    await session.commit()
    account = m.YoutrackAccount(
        youtrack_id=_user['id'],
        login=_user['login'],
        token_id=new_token_obj.id,
        employee_id=user.id,
    )
    session.add(account)
    await session.commit()
    return token


async def drop_user_token(user: m.Employee, session: AsyncSession) -> None:
    account = await get_youtrack_account(session=session, user=user)
    token_id = account.token_id
    if account and token_id:
        account.token_id = None
        await session.execute(
            sa.delete(m.YoutrackAccessToken).where(m.YoutrackAccessToken.id == token_id)
        )
        await session.commit()


class _AdminYoutrackProcessor:
    token: str
    timeout: int
    base_url: str
    youtrack_scope: str

    def __init__(
        self,
        base_url: str,
        token: str,
        timeout: int,
        youtrack_scope: str,
    ) -> None:
        self.base_url = base_url
        self.token = token
        self.timeout = timeout
        self.youtrack_scope = youtrack_scope

    def _request(
        self,
        url: str,
        method: str = 'GET',
        data: bytes | None = None,
        timeout: int | None = None,
        json_: bool = True,
    ) -> 'bytes | JsonT':
        if timeout is None:
            timeout = self.timeout
        _url = f'{self.base_url}{url}'
        if json_:
            return json_request(
                _url, self.token, method=method, data=data, timeout=timeout
            )
        res = base_request(_url, self.token, method=method, data=data, timeout=timeout)
        return res.read()

    def get(
        self,
        url: str,
    ) -> dict:
        return cast('JsonT', self._request(url, json_=True))

    def get_all_with_key(
        self, url: str, key: str, per_request: int = 100
    ) -> list['JsonT']:
        return list(
            load_with_key_generator(
                lambda u: self.get(u),  # pylint: disable=unnecessary-lambda
                url,
                key=key,
                per_request=per_request,
            )
        )

    def get_generator(
        self, url: str, per_request: int = 100
    ) -> Generator[dict, None, None]:
        return load_generator(
            lambda u: self.get(u),  # pylint: disable=unnecessary-lambda
            url,
            per_request=per_request,
        )

    def post(self, url: str, data: Any = None) -> dict:
        return cast(dict, self._request(url, method='POST', data=data, json_=True))

    def put(self, url: str, data: Any = None) -> dict:
        return cast(dict, self._request(url, method='PUT', data=data, json_=True))

    def delete(self, url: str, data: Any = None) -> dict:
        return cast(dict, self._request(url, method='DELETE', data=data, json_=True))

    def get_users(
        self, query: str | None = None, fields: FieldsT | None = None
    ) -> list['JsonT']:
        url = '/hub/api/rest/users'
        return self.get_all_with_key(build_url(url, query, fields), 'users')

    def get_user_by_login(
        self, login: str, with_banned: bool = False, fields: FieldsT | None = None
    ) -> JsonT:
        query = f'( login: {{{login}}} or authName: {{{login}}} or authLogin: {{{login}}} ) and not type: Reporter'
        if with_banned:
            query += ' and not is: banned'
        res = self.get_users(query, fields)
        if len(res) == 0:
            raise YoutrackUserNotFound('YouTrack user not found')
        if len(res) > 1:
            raise YoutrackTooManyAccounts('Too many YouTrack accounts')
        return res[0]

    def get_user_by_email(
        self, email: str, with_banned: bool = False, fields: FieldsT | None = None
    ) -> JsonT:
        query = f'( authEmail: {email} or email: {email} ) and not type: Reporter'
        if with_banned:
            query += ' and not is: banned'
        res = self.get_users(query, fields)
        if len(res) == 0:
            raise YoutrackUserNotFound('YouTrack user not found')
        if len(res) > 1:
            raise YoutrackTooManyAccounts('Too many YouTrack accounts')
        return res[0]

    def create_token(
        self, user_id: str, name: str, fields: FieldsT | None = None
    ) -> tuple[str, str]:
        url = f'/hub/api/rest/users/{user_id}/permanenttokens'
        args = make_args(fields=fields)
        if args:
            url += f'?{args}'
        result = self.post(
            url,
            {
                'name': name,
                'scope': [{'id': self.youtrack_scope, 'key': self.youtrack_scope}],
            },
        )
        try:
            return result['name'], result['token']
        except KeyError as e:
            raise YoutrackException('Token response invalid') from e

    def create_token_by_login(self, login: str) -> tuple[str, str]:
        user = self.get_user_by_login(login, fields=['id', 'banned'], with_banned=True)
        if user.get('banned', True):
            raise YoutrackException('YouTrack user is banned')
        return self.create_token(
            user['id'], name=generate_token_name(), fields=['name', 'token']
        )

    def get_project_by_short_name(
        self, name: str, fields: FieldsT | None = None
    ) -> dict | None:
        url = '/api/admin/projects'
        _fields: list[str] = []
        if fields is not None:
            _fields = list(fields)
        if 'shortName' not in _fields:
            _fields += ['shortName', 'id', 'name']
        for project in self.get_generator(build_url(url, fields=_fields)):
            if project['shortName'] == name:
                return project
        return None

    def get_project_fields(
        self, project_id: str, fields: FieldsT | None = None
    ) -> list[dict]:
        url = f'/api/admin/projects/{project_id}/fields'
        return list(self.get_generator(build_url(url, fields=fields)))

    def get_project_custom_fields(
        self, project_id: str, fields: FieldsT | None = None
    ) -> list[dict]:
        url = f'/api/admin/projects/{project_id}/customFields'
        return list(self.get_generator(build_url(url, fields=fields)))

    def list_issue(
        self,
        query: str | None = None,
        fields: FieldsT | None = None,
    ) -> list['IssueT']:
        url = '/api/issues'
        return cast(
            list['IssueT'],
            self.get_generator(build_url(url, query=query, fields=fields)),
        )


class YoutrackProcessor:  # pylint: disable=too-many-public-methods
    type = name = NAME
    token: str = CONFIG.YOUTRACK_API_TOKEN
    timeout: int
    issue_id_pattern: Pattern
    __admin: '_AdminYoutrackProcessor'
    session: AsyncSession

    def __init__(self, session: AsyncSession) -> None:
        self.timeout = TIMEOUT
        self.base_url = CONFIG.YOUTRACK_URL
        self.youtrack_scope = CONFIG.YOUTRACK_SCOPE
        self.session = session
        if self.base_url.endswith('/'):
            self.base_url = self.base_url[:-1]
        self.issue_id_pattern = re.compile(
            rf'{self.base_url}/issue/([A-Z0-9]+-\d+)', flags=re.I | re.M
        )
        try:
            self.__admin = _AdminYoutrackProcessor(
                self.base_url,
                self.token,
                self.timeout,
                self.youtrack_scope,
            )
        except KeyError as e:
            raise YoutrackException(f'token must be provided for plugin {NAME}') from e

    async def _request(
        self,
        user: 'm.Employee',
        url: str,
        method: str = 'GET',
        data: bytes | None = None,
        timeout: int | None = None,
        json_: bool = True,
        headers: Any = None,
        attempt: int = 0,
    ) -> 'bytes | JsonT':
        token = await get_token_from_user(self.__admin, self.session, user)
        if not token:
            raise YoutrackException(  # pylint: disable=broad-exception-raised
                'Please ask system administrators to set youtrack token manually',
                'token is None',
            )
        if timeout is None:
            timeout = self.timeout
        _url = f'{self.base_url}{url}'
        try:
            if json_:
                return json_request(
                    _url,
                    token,
                    method=method,
                    data=data,
                    timeout=timeout,
                    headers=headers,
                )
            res = base_request(
                _url,
                token,
                method=method,
                data=data,
                timeout=timeout,
                headers=headers,
            )
            return res.read()
        except HTTPError as e:
            if e.code == 400:
                raise YoutrackException(
                    json.load(e.fp).get('error_description', '')
                ) from e
            if e.code == 403:
                raise YoutrackException(
                    json.load(e.fp).get('error_description', '')
                ) from e
            if e.code == 401:
                if attempt == 0:
                    await drop_user_token(user, self.session)
                    return await self._request(
                        user=user,
                        url=url,
                        method=method,
                        data=data,
                        timeout=timeout,
                        json_=json_,
                        headers=headers,
                        attempt=1,
                    )
                raise YoutrackException('Your token is not authorized') from e
            raise

    async def get(
        self,
        user: 'm.Employee',
        url: str,
    ) -> list | dict:
        return cast('JsonT', await self._request(user, url, json_=True))

    async def post(
        self,
        user: 'm.Employee',
        url: str,
        headers: Any = None,
        data: Any = None,
        json_: bool = True,
    ) -> list | dict:
        return cast(
            dict,
            await self._request(
                user,
                url,
                method='POST',
                headers=headers,
                data=data,
                json_=json_,
            ),
        )

    async def put(self, user: 'm.Employee', url: str, data: Any = None) -> list | dict:
        return cast(
            dict, await self._request(user, url, method='PUT', data=data, json_=True)
        )

    async def delete(
        self, user: 'm.Employee', url: str, data: Any = None, json_: bool = False
    ) -> list | dict:
        return cast(
            dict,
            await self._request(user, url, method='DELETE', data=data, json_=json_),
        )

    async def list_issue(
        self,
        user: 'm.Employee',
        query: str | None = None,
        fields: FieldsT | None = None,
        top: int = 50,
        skip: int | None = None,
    ) -> list['IssueT']:
        url = '/api/issues'
        return cast(
            list['IssueT'],
            await self.get(
                user=user,
                url=build_url(url, query=query, fields=fields, top=top, skip=skip),
            ),
        )

    async def get_issues_count(
        self,
        user: 'm.Employee',
        query: str | None = None,
    ) -> 'IssuesCountT':
        url = '/api/issuesGetter/count'
        data = {'query': query}
        count_res = cast(
            'IssuesCountT',
            await self.post(
                user, build_url(url, query=query, fields=['count']), data=data
            ),
        )
        if count_res['count'] == -1:
            count_res = await self.get_issues_count(user=user, query=query)
        return cast('IssuesCountT', count_res)

    async def get_issue(
        self, user: 'm.Employee', issue_id: str, fields: FieldsT | None = None
    ) -> 'IssueT':
        url = f'/api/issues/{issue_id}'
        return cast(
            'IssueT', await self.get(user=user, url=build_url(url, fields=fields))
        )

    async def create_issue(
        self,
        user: 'm.Employee',
        project_short_name: str,
        summary: str,
        description: str | None = None,
        markdown: bool | None = None,
        tags: TagsT | None = None,
        custom_fields: list['CustomFieldListT'] | None = None,
        fields: FieldsT | None = None,
    ) -> 'IssueT':
        url = '/api/issues'
        field_to_load = ('field(name,fieldType(id),isUpdateable)',)
        project = self.__admin.get_project_by_short_name(
            project_short_name, fields=['id']
        )
        if not project:
            raise YoutrackException(
                f'project with shortName {project_short_name} was not found'
            )
        data: dict[str, Any] = {
            'summary': summary,
            'description': description,
            'project': {'id': project['id']},
        }
        if tags:
            data['tags'] = tags
        if markdown:
            data['usesMarkdown'] = markdown
        if custom_fields:
            project_fields = self.__admin.get_project_custom_fields(
                project['id'], fields=field_to_load
            )
            data['customFields'] = make_fields(custom_fields, project_fields)
        return cast(
            'IssueT',
            await self.post(user=user, url=build_url(url, fields=fields), data=data),
        )

    async def update_issue(
        self,
        user: 'm.Employee',
        issue_id: str,
        project_short_name: str,
        summary: str | None = None,
        description: str | None = None,
        custom_fields: list['CustomFieldListT'] | None = None,
        fields: FieldsT | None = None,
    ) -> 'IssueT':
        url = f'/api/issues/{issue_id}'
        field_to_load = ('field(name,fieldType(id),isUpdateable)',)
        project = self.__admin.get_project_by_short_name(
            project_short_name, fields=['id']
        )
        if not project:
            raise YoutrackException(
                f'project with shortName {project_short_name} was not found'
            )
        data: dict[str, Any] = {}
        if summary:
            data['summary'] = summary
        if description:
            data['description'] = description
        if custom_fields:
            project_fields = self.__admin.get_project_custom_fields(
                project['id'], fields=field_to_load
            )
            data['customFields'] = make_fields(custom_fields, project_fields)
        return cast(
            'IssueT',
            await self.post(user=user, url=build_url(url, fields=fields), data=data),
        )

    async def _upload_attachments(
        self,
        user: 'm.Employee',
        url: str,
        files: list[UploadFile],
        fields: FieldsT | None = None,
    ) -> list | dict:
        form = MultiPartForm()
        for file in files:
            form.add_file('file', file.filename or '', filehandle=file.file)
        data = bytes(form)
        headers = {
            'Content-Type': form.get_content_type(),
            'Content-Length': len(data),
        }
        res = await self.post(
            user=user,
            url=build_url(url, fields=fields),
            headers=headers,
            data=data,
            json_=False,
        )
        return res

    async def upload_issue_attachments(
        self,
        user: 'm.Employee',
        issue_id: str,
        files: list[UploadFile],
        fields: FieldsT | None = None,
    ) -> list['IssueAttachmentT']:
        url = f'/api/issues/{issue_id}/attachments'
        res = await self._upload_attachments(
            user=user, url=url, files=files, fields=fields
        )
        return cast(list['IssueAttachmentT'], res)

    async def get_issue_attachment(
        self,
        user: 'm.Employee',
        issue_id: str,
        attachment_id: str,
        fields: FieldsT | None = None,
    ) -> 'IssueAttachmentT':
        url = f'/api/issues/{issue_id}/attachments/{attachment_id}'
        return cast(
            'IssueAttachmentT',
            await self.get(
                user=user,
                url=build_url(url, fields=fields),
            ),
        )

    async def delete_issue_attachment(
        self,
        user: 'm.Employee',
        issue_id: str,
        attachment_id: str,
        fields: FieldsT | None = None,
    ) -> 'IssueAttachmentT':
        url = f'/api/issues/{issue_id}/attachments/{attachment_id}'
        return cast(
            'IssueAttachmentT',
            await self.delete(
                user=user,
                url=build_url(url, fields=fields),
            ),
        )

    async def get_issue_comment(
        self,
        user: 'm.Employee',
        issue_id: str,
        comment_id: str,
        fields: FieldsT | None = None,
    ) -> 'IssueCommentT':
        url = f'/api/issues/{issue_id}/comments/{comment_id}'
        return cast(
            'IssueCommentT',
            await self.get(user=user, url=build_url(url, fields=fields)),
        )

    async def create_issue_comment(
        self,
        user: 'm.Employee',
        issue_id: str,
        text: str,
        fields: FieldsT | None = None,
    ) -> 'IssueCommentT':
        url = f'/api/issues/{issue_id}/comments'
        data: dict[str, Any] = {
            'text': text,
        }
        return cast(
            'IssueCommentT',
            await self.post(user=user, url=build_url(url, fields=fields), data=data),
        )

    async def update_issue_comment(
        self,
        user: 'm.Employee',
        issue_id: str,
        comment_id: str,
        text: str,
        fields: FieldsT | None = None,
    ) -> 'IssueCommentT':
        url = f'/api/issues/{issue_id}/comments/{comment_id}'
        data: dict[str, Any] = {
            'text': text,
        }
        return cast(
            'IssueCommentT',
            await self.post(user=user, url=build_url(url, fields=fields), data=data),
        )

    async def delete_issue_comment(
        self,
        user: 'm.Employee',
        issue_id: str,
        comment_id: str,
        fields: FieldsT | None = None,
    ) -> 'IssueCommentT':
        url = f'/api/issues/{issue_id}/comments/{comment_id}'
        return cast(
            'IssueCommentT',
            await self.delete(user=user, url=build_url(url, fields=fields)),
        )

    async def upload_issue_comment_attachments(
        self,
        user: 'm.Employee',
        issue_id: str,
        comment_id: str,
        files: list[UploadFile],
        fields: FieldsT | None = None,
    ) -> list | dict:
        url = f'/api/issues/{issue_id}/comments/{comment_id}/attachments'
        res = await self._upload_attachments(
            user=user, url=url, files=files, fields=fields
        )
        return res

    def get_project_fields(
        self, project_id: str, fields: FieldsT | None = None
    ) -> list[dict]:
        return self.__admin.get_project_fields(project_id=project_id, fields=fields)

    def get_project_custom_fields(
        self, project_id: str, fields: FieldsT | None = None
    ) -> list[dict]:
        return self.__admin.get_project_custom_fields(
            project_id=project_id, fields=fields
        )

    def list_project(
        self,
        fields: FieldsT | None = None,
    ) -> list[Any]:
        url = '/api/admin/projects'
        return list(self.__admin.get_generator(build_url(url, fields=fields)))

    async def apply_command(
        self,
        user: 'm.Employee',
        issue_ids: list[str],
        query: str,
        comment: str = None,
        silent: bool = False,
        fields: FieldsT = None,
    ) -> list['IssueT']:
        if fields is None:
            fields = ['idReadable']
        fields = ['issues(' + ','.join(fields) + ')']
        url = '/api/commands'
        data = {
            'query': query,
            'issues': [{'idReadable': issue_id} for issue_id in issue_ids],
            'silent': silent,
            'comment': comment,
        }
        response = await self.post(
            user=user, url=build_url(url, fields=fields), data=data
        )
        return cast(list['IssueT'], response.get('issues', []))
