import asyncio
from datetime import datetime
from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.config import CONFIG
from wb.db import get_db_session
from wb.routes.v1.employee.router import dismiss_employee
from wb.routes.v1.request.add_employee.utils import make_notification_message
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    ListFilterParams,
    SuccessPayloadOutput,
)
from wb.services.confluence import confluence_api, confluence_xml_converter
from wb.services.employee import get_employee_by_id
from wb.services.youtrack.youtrack import YoutrackProcessor
from wb.tasks.send.bbot import task_send_bbot_message
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import make_id_output, make_list_output, make_success_output
from wb.utils.search import filter_to_query, sort_to_query

from .schemas import (
    DismissEmployeeRequestApprove,
    DismissEmployeeRequestCreate,
    DismissEmployeeRequestOut,
    DismissEmployeeRequestUpdate,
)

__all__ = ('router',)

router = APIRouter(
    prefix='/api/v1/request/dismiss-employee', tags=['v1', 'dismiss-employee-request']
)


@router.get('/list')
async def list_dismiss_employee_requests(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[DismissEmployeeRequestOut]:
    curr_user = current_employee()
    user_roles = set(curr_user.roles)
    has_access = bool({'admin', 'hr', 'recruiter', 'super_hr'}.intersection(user_roles))
    if not has_access:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    q = sa.select(m.DismissEmployeeRequest)
    if query.filter:
        q = q.filter(
            filter_to_query(
                query.filter, m.DismissEmployeeRequest, available_fields=['status']
            )
        )  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.DismissEmployeeRequest.updated,)
    if query.sort_by:
        sorts = sort_to_query(
            m.DismissEmployeeRequest,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['updated', 'status'],
        )
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[DismissEmployeeRequestOut.from_obj(req) for req in results.all()],
    )


@router.get('/{req_id}')
async def get_dismiss_employee_request(
    req_id: int, session: AsyncSession = Depends(get_db_session)
) -> SuccessPayloadOutput[DismissEmployeeRequestOut]:
    req = await session.scalar(
        sa.select(m.DismissEmployeeRequest).where(m.DismissEmployeeRequest.id == req_id)
    )
    if not req:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Request not found')
    return make_success_output(payload=DismissEmployeeRequestOut.from_obj(req))


@router.post('')
async def create_dismiss_employee_request(  # pylint: disable=too-many-locals
    body: DismissEmployeeRequestCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    user_roles = set(curr_user.roles)
    has_access = bool({'admin', 'hr', 'recruiter', 'super_hr'}.intersection(user_roles))
    if not has_access:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    existed_request: m.DismissEmployeeRequest = await session.scalar(
        sa.select(m.DismissEmployeeRequest).where(
            sa.and_(
                m.DismissEmployeeRequest.employee_id == body.employee_id,
                m.DismissEmployeeRequest.status.in_(['NEW', 'APPROVED']),
            )
        )
    )
    if existed_request:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Duplicate')
    settings: m.EmployeeRequestSettings | None = await session.scalar(
        sa.select(m.EmployeeRequestSettings)
    )
    if not settings:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Settings not found')
    employee: m.Employee | None = await get_employee_by_id(
        employee_id=body.employee_id, session=session
    )
    if not employee:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Employee not found')
    if not employee.active:
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail='Employee is not active')
    request = m.DismissEmployeeRequest(
        status='NEW',
        created_by_id=curr_user.id,
        employee_id=body.employee_id,
        youtrack_issue_id='',
        dismiss_datetime=body.dismiss_datetime.replace(tzinfo=None),
        description=body.description,
    )
    session.add(request)
    await session.flush()
    link_to_request = f'[View request in Workbench]({CONFIG.PUBLIC_BASE_URL}/requests/dismiss-employee/{request.id})'
    if CONFIG.YOUTRACK_URL:
        youtrack_processor = YoutrackProcessor(session=session)
        article_content = None
        if confluence_api and CONFIG.CONFLUENCE_OFFBOARD_ARTICLE_PAGE_ID:
            article_content = await confluence_api.get_page_content(
                CONFIG.CONFLUENCE_OFFBOARD_ARTICLE_PAGE_ID
            )
        article_markdown = (
            confluence_xml_converter.to_markdown(article_content)
            if article_content
            else None
        )
        main_project = next(
            (project for project in settings.youtrack_projects if project['main']), None
        )
        if not main_project:
            raise HTTPException(
                HTTPStatus.CONFLICT,
                detail='No main project in the settings. Set the main project flag in the employee request settings',
            )
        main_issue = await youtrack_processor.create_issue(
            user=curr_user,
            project_short_name=main_project['short_name'],
            summary=f'Offboard employee {employee.english_name} - Dismiss datetime: {body.dismiss_datetime.strftime("%d/%m/%Y %H:%M GMT+0")}',
            description=link_to_request,
            markdown=True,
            fields=['id', 'idReadable'],
        )
        request.youtrack_issue_id = main_issue['idReadable']
        if article_markdown:
            await youtrack_processor.create_issue_comment(
                user=curr_user,
                issue_id=main_issue['idReadable'],
                text='### Checklist\n' + article_markdown,
            )
        secondary_issues = await asyncio.gather(
            *[
                youtrack_processor.create_issue(
                    user=curr_user,
                    project_short_name=project['short_name'],
                    summary=f'Offboard employee {employee.english_name} - Dismiss datetime: {body.dismiss_datetime.strftime("%d/%m/%Y %H:%M GMT+0")}',
                    tags=project['tags'],
                    markdown=True,
                    fields=['id', 'idReadable'],
                )
                for project in settings.youtrack_projects
                if not project['main']
            ],
        )
        await youtrack_processor.apply_command(
            user=curr_user,
            issue_ids=[issue['idReadable'] for issue in secondary_issues],
            query=f'subtask of {main_issue["idReadable"]}',
        )
    try:
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Duplicate') from err
    msg = f'New request to dismiss employee {employee.english_name} created by {curr_user.link_pararam}\n{link_to_request}\n'
    request_summary = make_notification_message(
        dismiss=True,
        person=employee.link_pararam,
        dismiss_datetime=body.dismiss_datetime,
        position=employee.position.name if employee.position else None,
        managers=[manager.link_pararam for manager in employee.managers],
    )
    msg += request_summary
    task_send_bbot_message.delay(
        identificator=settings.chat_id, message=msg, recipient='chat'
    )
    return make_id_output(request.id)


@router.put('/{request_id}')
async def update_dismiss_employee_request(  # pylint: disable=too-many-locals
    request_id: int,
    body: DismissEmployeeRequestUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    user_roles = set(curr_user.roles)
    has_access = bool({'super_hr', 'hr', 'recruiter'}.intersection(user_roles))
    if not has_access:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    request: m.DismissEmployeeRequest | None = await session.scalar(
        sa.select(m.DismissEmployeeRequest).where(
            m.DismissEmployeeRequest.id == request_id
        )
    )
    if not request:
        raise HTTPException(404, detail='Request not found')
    if request.status in ('CANCELED', 'CLOSED', 'APPROVED'):
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail='Request cannot be updated')
    settings: m.EmployeeRequestSettings | None = await session.scalar(
        sa.select(m.EmployeeRequestSettings)
    )
    if not settings:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Settings not found')
    target_project = next(
        project for project in settings.youtrack_projects if project['main']
    )
    if not target_project:
        raise HTTPException(
            HTTPStatus.CONFLICT,
            detail='No target YouTrack project in settings. Customize projects in request settings',
        )
    data = body.dict(exclude_unset=True)
    if 'dismiss_datetime' in data:
        request.dismiss_datetime = body.dismiss_datetime.replace(tzinfo=None)
        data.pop('dismiss_datetime')
    for k, v in data.items():
        setattr(request, k, v)
    if CONFIG.YOUTRACK_URL:
        youtrack_processor = YoutrackProcessor(session=session)
        issue = await youtrack_processor.get_issue(
            user=curr_user,
            issue_id=request.youtrack_issue_id,
            fields=[
                'idReadable',
                'links(linkType,issues(idReadable,project(shortName)))',
            ],
        )
        await youtrack_processor.update_issue(
            user=curr_user,
            issue_id=request.youtrack_issue_id,
            project_short_name=target_project['short_name'],
            summary=f'Offboard employee {request.employee.english_name} - Dismiss datetime: {request.dismiss_datetime.strftime("%d/%m/%Y %H:%M GMT+0")}',
        )
        await youtrack_processor.create_issue_comment(
            user=curr_user,
            issue_id=request.youtrack_issue_id,
            text=f'Request updated by {curr_user.link_pararam}\n{request.link}',
        )
        linked_issues = [item for link in issue['links'] for item in link['issues']]
        await asyncio.gather(
            *[
                youtrack_processor.update_issue(
                    user=curr_user,
                    issue_id=issue['idReadable'],
                    project_short_name=issue['project']['shortName'],
                    summary=f'Offboard employee {request.employee.english_name} - '
                    f'Dismiss datetime: {request.dismiss_datetime.strftime("%d/%m/%Y %H:%M GMT+0")}',
                )
                for issue in linked_issues
            ]
        )
    request.updated = datetime.utcnow()
    if session.is_modified(request):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(409, detail='duplicate') from err
    msg = f'Request to dismiss employee {request.employee.english_name} updated by {curr_user.link_pararam}\n{request.link}\n'
    task_send_bbot_message.delay(
        identificator=settings.chat_id, message=msg, recipient='chat'
    )
    return make_id_output(request.id)


@router.put('/{request_id}/approve')
async def approve_dismiss_employee_request(
    request_id: int,
    body: DismissEmployeeRequestApprove,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    request: m.DismissEmployeeRequest | None = await session.scalar(
        sa.select(m.DismissEmployeeRequest).where(
            m.DismissEmployeeRequest.id == request_id
        )
    )
    if not request:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Request not found')
    if request.status in ('CANCELED', 'CLOSED', 'APPROVED'):
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail='Request cannot be approved')
    if not body.checklist_checked:
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail='Checklist not checked')
    await dismiss_employee(employee_id=request.employee_id, session=session)
    request.checklist_checked = True
    request.status = 'APPROVED'
    request.updated = datetime.utcnow()
    if session.is_modified(request):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(HTTPStatus.CONFLICT, detail='Duplicate') from err
    return make_id_output(request.id)


@router.put('/{request_id}/cancel')
async def cancel_dismiss_employee_request(
    request_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    user_roles = set(curr_user.roles)
    has_access = bool({'admin', 'super_hr', 'hr', 'recruiter'}.intersection(user_roles))
    if not has_access:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    request: m.DismissEmployeeRequest | None = await session.scalar(
        sa.select(m.DismissEmployeeRequest).where(
            m.DismissEmployeeRequest.id == request_id
        )
    )
    if not request:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Request not found')
    if request.status in ('CANCELED', 'CLOSED', 'APPROVED'):
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail='Request cannot be canceled')
    request.status = 'CANCELED'
    request.updated = datetime.utcnow()
    if session.is_modified(request):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(HTTPStatus.FORBIDDEN, detail='Duplicate') from err
    return make_id_output(request.id)
