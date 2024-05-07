import json
from http import HTTPStatus
from typing import Any, List

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BasePayloadOutput,
    RequestQueryParams,
    SuccessPayloadOutput,
)
from wb.services.youtrack.utils import YoutrackException
from wb.services.youtrack.youtrack import YoutrackProcessor
from wb.utils.current_user import current_employee
from wb.utils.query import make_list_output, make_success_output

from .schemas import IssueOut, RequestComment, RequestCreate, RequestOut
from .utils import make_yt_issue_comment_text, make_yt_query

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/help-center/request', tags=['v1', 'request'])

USER_FIELDS = 'id,login,email,fullName,avatarUrl'

ATTACHMENTS_FIELDS = f'id,name,author({USER_FIELDS}),created,updated,size,extension,mimeType,url,thumbnailURL,issue(id)'

COMMENT_FIELDS = f'id,text,author({USER_FIELDS}),issue(id),created,updated,attachments({ATTACHMENTS_FIELDS})'

ISSUE_LIST_FIELDS = [
    'id',
    'idReadable',
    'project(id,name,shortName)',
    'summary',
    f'reporter({USER_FIELDS})',
    f'updater({USER_FIELDS})',
    'created',
    'updated',
    'resolved',
    'customFields(name,value(name))',
]

ISSUE_DETAIL_FIELDS = ISSUE_LIST_FIELDS + [
    'description',
    f'attachments({ATTACHMENTS_FIELDS})',
    f'comments({COMMENT_FIELDS})',
]


@router.get('/list')
async def list_requests(
    params: RequestQueryParams = Depends(RequestQueryParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[IssueOut]:
    user = current_employee()
    youtrack_processor = YoutrackProcessor(session=session)
    user_requests_query = sa.select(m.HelpCenterRequest).where(
        m.HelpCenterRequest.created_by_id == user.id
    )
    user_requests_raw = await session.scalars(user_requests_query)
    user_requests = user_requests_raw.all()
    if params.requester == 'me' and len(user_requests) == 0:
        return make_list_output(
            count=0,
            limit=params.limit,
            offset=params.offset,
            items=[],
        )
    portals_query = sa.select(m.Portal).where(m.Portal.is_active.is_(True))
    portals = await session.scalars(portals_query)
    projects = [portal.youtrack_project for portal in portals.all()]
    yt_query = make_yt_query(
        projects=projects,
        params=params,
    )
    try:
        issues_count_res = await youtrack_processor.get_issues_count(
            user=user, query=yt_query
        )
        count = issues_count_res['count']
        results = await youtrack_processor.list_issue(
            user=user,
            fields=ISSUE_LIST_FIELDS,
            query=yt_query,
            top=params.limit,
            skip=params.offset if params.offset else None,
        )
        return make_list_output(
            count=count,
            limit=params.limit,
            offset=params.offset,
            items=results,
        )
    except YoutrackException as err:
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(err)) from err


@router.get('/{issue_id}')
async def get_request(
    issue_id: str, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[RequestOut]:
    curr_user = current_employee()
    youtrack_processor = YoutrackProcessor(session=session)
    obj: m.HelpCenterRequest | None = await session.scalar(
        sa.select(m.HelpCenterRequest).where(m.HelpCenterRequest.issue_id == issue_id)
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Service request not found')
    try:
        issue = await youtrack_processor.get_issue(
            curr_user, issue_id=issue_id, fields=ISSUE_DETAIL_FIELDS
        )
        return make_success_output(payload=RequestOut.from_obj(obj=obj, issue=issue))
    except YoutrackException as err:
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(err)) from err


@router.post('')
async def create_request(
    body: RequestCreate, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[Any]:
    user = current_employee()
    youtrack_account: m.YoutrackAccount | None = await session.scalar(
        sa.select(m.YoutrackAccount).where(
            m.YoutrackAccount.employee_id == user.id,
            m.YoutrackAccount.banned.is_(False),
        )
    )
    service: m.Service | None = await session.scalar(
        sa.select(m.Service).where(m.Service.id == body.service_id)
    )
    if not service:
        raise HTTPException(404, detail='Service not found')
    youtrack_processor = YoutrackProcessor(session=session)
    project_fields: list[Any] = youtrack_processor.get_project_fields(
        project_id=service.group.portal.youtrack_project,
        fields=['id', 'field(id,name)'],
    )
    service_field_exist = any(f['field']['name'] == 'Service' for f in project_fields)
    issue_data = {
        'user': user,
        'project_short_name': service.group.portal.youtrack_project,
        'summary': body.summary,
        'fields': ['id', 'idReadable'],
        'custom_fields': [('Channel', 'WB')],
    }
    if youtrack_account:
        issue_data['custom_fields'] += [('Owner', youtrack_account.login)]
    if service.predefined_custom_fields:
        issue_data['custom_fields'] += [
            (field['name'], field['value'])
            for field in json.loads(service.predefined_custom_fields)
            if field['value']
        ]
    if service_field_exist:
        issue_data['custom_fields'] += [('Service', service.name)]
    if body.description:
        issue_data['description'] = body.description
    try:
        new_issue = await youtrack_processor.create_issue(**issue_data)
        if body.fields:
            comment_text = make_yt_issue_comment_text(body.fields)
            await youtrack_processor.create_issue_comment(
                user=user,
                issue_id=new_issue['idReadable'],
                text=comment_text,
                fields=['id'],
            )
    except YoutrackException as err:
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(err)) from err
    request_data = {
        'service_id': body.service_id,
        'created_by': user,
        'issue_id': new_issue['idReadable'],
    }
    try:
        obj = m.HelpCenterRequest(**request_data)
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(HTTPStatus.CONFLICT, detail='duplicate') from err
    return make_success_output(payload=new_issue)


@router.post('/{issue_id}/attachments')
async def upload_request_attachments(
    issue_id: str,
    files: List[UploadFile],
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[Any]:
    user = current_employee()
    youtrack_processor = YoutrackProcessor(session=session)
    try:
        await youtrack_processor.upload_issue_attachments(
            user=user, issue_id=issue_id, files=files, fields=[ATTACHMENTS_FIELDS]
        )
        return make_success_output(payload={'id': issue_id})
    except YoutrackException as err:
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(err)) from err


@router.delete('/{issue_id}/attachments/{attachment_id}')
async def delete_request_attachment(
    issue_id: str,
    attachment_id: str,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[Any]:
    user = current_employee()
    youtrack_processor = YoutrackProcessor(session=session)
    try:
        attachment = await youtrack_processor.get_issue_attachment(
            user=user,
            issue_id=issue_id,
            attachment_id=attachment_id,
            fields=[ATTACHMENTS_FIELDS],
        )
        if attachment['author']['email'] != user.email:
            raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
        await youtrack_processor.delete_issue_attachment(
            user=user,
            issue_id=issue_id,
            attachment_id=attachment_id,
            fields=[ATTACHMENTS_FIELDS],
        )
        return make_success_output(payload={'id': attachment_id})
    except YoutrackException as err:
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(err)) from err


async def change_request_state(
    issue_id: str, state: str, session: AsyncSession
) -> SuccessPayloadOutput:
    user = current_employee()
    cannot_change = not (user.is_admin or user.is_hr)
    youtrack_processor = YoutrackProcessor(session=session)
    request: m.HelpCenterRequest | None = await session.scalar(
        sa.select(m.HelpCenterRequest).where(m.HelpCenterRequest.issue_id == issue_id)
    )
    if not request:
        raise HTTPException(404, detail='Service request not found')
    if cannot_change and request.created_by_id != user.id:
        raise HTTPException(403, detail='Forbidden')
    fields = ['id', 'idReadable', 'customFields(id,name,value(name))']
    custom_fields = [('State', state)]
    issue = await youtrack_processor.update_issue(
        user=user,
        issue_id=issue_id,
        project_short_name=request.service.group.portal.youtrack_project,
        fields=fields,
        custom_fields=custom_fields,
    )
    return make_success_output(payload=issue)


@router.post('/{issue_id}/resolve')
async def resolve_request(
    issue_id: str, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[Any]:
    youtrack_processor = YoutrackProcessor(session=session)
    obj: m.HelpCenterRequest | None = await session.scalar(
        sa.select(m.HelpCenterRequest).where(m.HelpCenterRequest.issue_id == issue_id)
    )
    if not obj:
        raise HTTPException(404, detail='Request not found')
    fields = ['id', 'field(id,name)', 'bundle(id,name,values(name,isResolved))']
    project_fields: list[Any] = youtrack_processor.get_project_fields(
        project_id=obj.service.group.portal.youtrack_project, fields=fields
    )
    states = []
    for project_field in project_fields:
        if project_field['field']['name'] == 'State':
            for value in project_field['bundle']['values']:
                if value.get('isResolved') is True:
                    states.append(value['name'])
    for state in states:
        try:
            return await change_request_state(
                issue_id=issue_id, state=state, session=session
            )
        except HTTPException as e:
            raise HTTPException(e.status_code, detail=e.detail) from e
        except ValueError:  # pylint: disable=bare-except
            pass
    raise HTTPException(
        HTTPStatus.INTERNAL_SERVER_ERROR,
        detail='Request cannot be resolved. Contact support',
    )


@router.post('/{issue_id}/comment')
async def create_request_comment(
    issue_id: str,
    body: RequestComment,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[Any]:
    user = current_employee()
    youtrack_processor = YoutrackProcessor(session=session)
    try:
        comment = await youtrack_processor.create_issue_comment(
            user=user, issue_id=issue_id, text=body.text, fields=['id']
        )
        return make_success_output(payload=comment)
    except YoutrackException as err:
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(err)) from err


@router.put('/{issue_id}/comment/{comment_id}')
async def update_request_comment(
    issue_id: str,
    comment_id: str,
    body: RequestComment,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[Any]:
    user = current_employee()
    youtrack_processor = YoutrackProcessor(session=session)
    try:
        comment = await youtrack_processor.get_issue_comment(
            user=user, issue_id=issue_id, comment_id=comment_id, fields=[COMMENT_FIELDS]
        )
        if comment['author']['email'] != user.email:
            raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
        updated_comment = await youtrack_processor.update_issue_comment(
            user=user,
            issue_id=issue_id,
            comment_id=comment_id,
            text=body.text,
            fields=['id'],
        )
        return make_success_output(payload=updated_comment)
    except YoutrackException as err:
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(err)) from err


@router.delete('/{issue_id}/comment/{comment_id}')
async def delete_request_comment(
    issue_id: str,
    comment_id: str,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[Any]:
    user = current_employee()
    youtrack_processor = YoutrackProcessor(session=session)
    try:
        comment = await youtrack_processor.get_issue_comment(
            user=user, issue_id=issue_id, comment_id=comment_id, fields=[COMMENT_FIELDS]
        )
        if comment['author']['email'] != user.email:
            raise HTTPException(403, detail='Forbidden')
        await youtrack_processor.delete_issue_comment(
            user=user, issue_id=issue_id, comment_id=comment_id
        )
        return make_success_output(payload={'id': issue_id})
    except YoutrackException as err:
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(err)) from err


@router.post('/{issue_id}/comment/{comment_id}/attachments')
async def upload_request_comment_attachments(
    issue_id: str,
    comment_id: str,
    files: List[UploadFile],
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[Any]:
    user = current_employee()
    youtrack_processor = YoutrackProcessor(session=session)
    try:
        await youtrack_processor.upload_issue_comment_attachments(
            user=user,
            issue_id=issue_id,
            comment_id=comment_id,
            files=files,
            fields=[ATTACHMENTS_FIELDS],
        )
        return make_success_output(payload={'id': comment_id})
    except YoutrackException as err:
        raise HTTPException(HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(err)) from err
