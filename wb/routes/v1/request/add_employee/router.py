import json
from datetime import datetime, timedelta, timezone
from http import HTTPStatus

import caldav
import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.config import CONFIG
from wb.db import get_db_session
from wb.routes.v1.employee.router import create_employee
from wb.routes.v1.employee.schemas import EmployeeCreate
from wb.routes.v1.request.add_employee.utils import (
    make_notification_message,
    make_pararam_link,
)
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    ListFilterParams,
    SuccessPayloadOutput,
)
from wb.services.calendar import CalDAVClient, get_calendar_client
from wb.services.employee import check_similar_usernames
from wb.services.youtrack.utils import YoutrackException
from wb.services.youtrack.youtrack import YoutrackProcessor
from wb.tasks.send.bbot import task_send_bbot_message
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import make_id_output, make_list_output, make_success_output
from wb.utils.search import filter_to_query, sort_to_query

from .schemas import (
    AddEmployeeRequestApprove,
    AddEmployeeRequestCreate,
    AddEmployeeRequestOut,
    AddEmployeeRequestUpdate,
    OnboardingData,
)

__all__ = ('router',)

router = APIRouter(
    prefix='/api/v1/request/add-employee', tags=['v1', 'add-employee-request']
)


def create_datetime(dt: datetime, time: str) -> datetime:
    hour, minute = time.split(':')
    return datetime(
        year=dt.year,
        month=dt.month,
        day=dt.day,
        hour=int(hour),
        minute=int(minute),
        second=0,
        tzinfo=timezone.utc,
    )


async def validate_add_employee_request_data(
    onboarding_data: OnboardingData,
    settings: m.EmployeeRequestSettings,
    calendar: CalDAVClient | None,
) -> None:
    now = datetime.now(timezone.utc)
    if onboarding_data.start < now or onboarding_data.end < now:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            detail='Date and time of onboarding cannot be set in the past',
        )
    if onboarding_data.start > onboarding_data.end:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, detail='Start date cannot be later than end date'
        )
    if (onboarding_data.end - onboarding_data.start) / timedelta(
        hours=1
    ) > settings.duration:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            detail=f'Maximum duration of onboarding is {settings.duration} hour(s)',
        )
    work_start = create_datetime(onboarding_data.start, settings.work_start)
    work_end = create_datetime(onboarding_data.end, settings.work_end)
    if not (work_start <= onboarding_data.start <= work_end) or not (
        work_start <= onboarding_data.end <= work_end
    ):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            detail='Onboarding time outside of working hours',
        )
    if not calendar:
        return
    events: list[caldav.Event] = []
    for calendar_id in settings.calendar_ids:
        events.extend(
            calendar.list_events(
                calendar_id=calendar_id,
                start_date=onboarding_data.start,
                end_date=onboarding_data.end,
            )
        )
    if next(
        (
            event
            for event in events
            if settings.unavailability_label
            in event.vobject_instance.vevent.summary.value
        ),
        False,
    ):
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            detail='Onboarding is unavailable due to the daily sync of the support team',
        )
    if len(events) > settings.max_number_parallel_meetings:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            detail=f'Maximum number of parallel onboardings is {settings.max_number_parallel_meetings}',
        )


@router.get('/list')
async def list_add_employee_requests(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[AddEmployeeRequestOut]:
    curr_user = current_employee()
    user_roles = set(curr_user.roles)
    has_access = bool(
        {'admin', 'hr', 'recruiter', 'super_hr', 'super_admin'}.intersection(user_roles)
    )
    if not has_access:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    q = sa.select(m.AddEmployeeRequest)
    if query.filter:
        q = q.filter(
            filter_to_query(  # type: ignore
                query.filter,
                m.AddEmployeeRequest,
                available_fields=[
                    'status',
                    'employee_data.english_name',
                ],
            )
        )
    count = await count_select_query_results(q, session=session)
    sorts = (m.AddEmployeeRequest.updated,)
    if query.sort_by:
        sorts = sort_to_query(
            m.AddEmployeeRequest,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=[
                'updated',
                'status',
                'created_by',
                'employee_data.english_name',
                'employee_data.work_started',
            ],
        )
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[AddEmployeeRequestOut.from_obj(req) for req in results.all()],
    )


@router.get('/{req_id}')
async def get_add_employee_request(
    req_id: int, session: AsyncSession = Depends(get_db_session)
) -> SuccessPayloadOutput[AddEmployeeRequestOut]:
    curr_user = current_employee()
    user_roles = set(curr_user.roles)
    has_access = bool(
        {'admin', 'hr', 'recruiter', 'super_hr', 'super_admin'}.intersection(user_roles)
    )
    if not has_access:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    req = await session.scalar(
        sa.select(m.AddEmployeeRequest).where(m.AddEmployeeRequest.id == req_id)
    )
    if not req:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='request not found')
    return make_success_output(payload=AddEmployeeRequestOut.from_obj(req))


@router.post('')
async def create_add_employee_request(  # pylint: disable=too-many-locals, too-many-branches, too-many-statements
    body: AddEmployeeRequestCreate,
    session: AsyncSession = Depends(get_db_session),
    calendar: CalDAVClient | None = Depends(get_calendar_client),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    user_roles = set(curr_user.roles)
    has_access = bool({'super_hr', 'hr', 'recruiter'}.intersection(user_roles))
    if not has_access:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    employee_data = body.employee_data
    onboarding_data = body.onboarding_data
    existing_employee = await session.scalar(
        sa.select(m.Employee).where(
            sa.or_(
                m.Employee.account == employee_data.account,
                m.Employee.email == employee_data.email,
                m.Employee.pararam == employee_data.pararam,
            )
        )
    )
    if existing_employee:
        raise HTTPException(
            HTTPStatus.CONFLICT,
            detail='Person with such an account/email/pararam already exists',
        )
    if similar_username := await check_similar_usernames(
        body.employee_data.account, session=session
    ):
        raise HTTPException(
            HTTPStatus.CONFLICT,
            detail=f'Username {body.employee_data.account} is similar to {similar_username}',
        )
    settings: m.EmployeeRequestSettings | None = await session.scalar(
        sa.select(m.EmployeeRequestSettings)
    )
    if not settings:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Settings not found')
    auto_approved = bool({'hr', 'recruiter'} & user_roles)
    obj = m.AddEmployeeRequest(
        status='NEW',
        created_by=curr_user,
        employee_data='',
        onboarding_data='',
        approved_by_hr_id=curr_user.id if auto_approved else None,
    )
    session.add(obj)
    if CONFIG.DEV_MODE:
        employee_data_as_dict = employee_data.dict()
        employee_data_as_dict['work_started'] = employee_data.work_started.strftime(
            '%Y-%m-%d'
        )
        obj.employee_data = employee_data_as_dict
        await session.commit()
        return make_id_output(obj.id)
    await validate_add_employee_request_data(
        onboarding_data=onboarding_data,
        settings=settings,
        calendar=calendar,
    )
    await session.flush()
    base_summary = f'{onboarding_data.organization.label}: {employee_data.english_name}'
    description = (
        body.onboarding_data.description + ('\n' + (settings.content or ''))
        if body.onboarding_data.description
        else (settings.content or '')
    )
    events: list[caldav.Event] = []
    if calendar:
        for calendar_id in settings.calendar_ids:
            event = calendar.create_event(
                start=onboarding_data.start,
                end=onboarding_data.end,
                calendar_id=calendar_id,
                summary=base_summary + ' onboarding',
                description=description,
            )
            events.append(event)
    link_to_request = f'[View request in Workbench]({CONFIG.PUBLIC_BASE_URL}/requests/add-employee/{obj.id})'
    calendar_links = '\n'.join(
        f'[Calendar event]({str(event.url)})' for event in events
    )
    issue = None
    if CONFIG.YOUTRACK_URL:
        youtrack_processor = YoutrackProcessor(session=session)
        issue_description = '\n'.join(
            [link_to_request, calendar_links, onboarding_data.description]
        )
        target_project = next(
            (project for project in settings.youtrack_projects if project['main']),
            None,
        )
        if not target_project:
            raise HTTPException(
                HTTPStatus.CONFLICT,
                detail='No target YouTrack project in settings. Customize projects in request settings',
            )
        try:
            issue = await youtrack_processor.create_issue(
                user=curr_user,
                project_short_name=target_project['short_name'],
                fields=['id', 'idReadable'],
                summary=base_summary
                + f' - Start date: {employee_data.work_started.strftime("%d/%m/%Y")}',
                description=issue_description,
                markdown=True,
            )
        except YoutrackException as err:
            raise HTTPException(
                HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(err)
            ) from err
    employee_data_as_dict = employee_data.dict()
    onboarding_data_as_dict = onboarding_data.dict()
    employee_data_as_dict['work_started'] = employee_data.work_started.strftime(
        '%Y-%m-%d'
    )
    onboarding_data_as_dict['start'] = onboarding_data.start.isoformat()
    onboarding_data_as_dict['end'] = onboarding_data.end.isoformat()
    onboarding_data_as_dict['calendar_events'] = [
        {'id': event.vobject_instance.vevent.uid.value, 'link': str(event.url)}
        for event in events
    ]
    onboarding_data_as_dict['youtrack_issue_id'] = (
        issue['idReadable'] if issue else None
    )
    obj.employee_data = employee_data_as_dict
    obj.onboarding_data = json.dumps(onboarding_data_as_dict)
    await session.commit()
    msg = f'New request to add employee {employee_data.english_name} created by {curr_user.link_pararam}\n{link_to_request}\n'
    request_summary = make_notification_message(
        person=employee_data.english_name,
        work_start_date=employee_data.work_started,
        position=employee_data.position.label if employee_data.position else None,
        managers=[make_pararam_link(manager) for manager in employee_data.managers],
        mentors=[make_pararam_link(mentor) for mentor in employee_data.mentors],
    )
    msg += request_summary
    task_send_bbot_message.delay(settings.chat_id, msg, 'chat')
    return make_id_output(obj.id)


@router.put('/{request_id}')
async def update_add_employee_request(  # pylint: disable=too-many-locals, too-many-statements
    request_id: int,
    body: AddEmployeeRequestUpdate,
    session: AsyncSession = Depends(get_db_session),
    calendar: CalDAVClient | None = Depends(get_calendar_client),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    user_roles = set(curr_user.roles)
    has_access = bool({'super_hr', 'hr', 'recruiter'}.intersection(user_roles))
    if not has_access:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    employee_data = body.employee_data.model_dump()
    onboarding_data = body.onboarding_data.model_dump()
    request: m.AddEmployeeRequest | None = await session.scalar(
        sa.select(m.AddEmployeeRequest).where(m.AddEmployeeRequest.id == request_id)
    )
    if not request:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Request not found')
    if request.status in ['CANCELED', 'CLOSED', 'APPROVED']:
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail='Request cannot be updated')
    settings: m.EmployeeRequestSettings | None = await session.scalar(
        sa.select(m.EmployeeRequestSettings)
    )
    if not settings:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Settings not found')
    if 'account' in employee_data and (
        similar_username := await check_similar_usernames(
            employee_data['account'],
            session=session,
            exclude_account=request.employee_data['account'],
        )
    ):
        raise HTTPException(
            HTTPStatus.CONFLICT,
            detail=f'Username {employee_data["account"]} is similar to {similar_username}',
        )
    request_onboarding_data = json.loads(request.onboarding_data)
    if CONFIG.DEV_MODE:
        employee_data['work_started'] = employee_data['work_started'].strftime(
            '%Y-%m-%d'
        )
        request.employee_data = employee_data
        onboarding_data['start'] = onboarding_data['start'].isoformat()
        onboarding_data['end'] = onboarding_data['end'].isoformat()
        onboarding_data['calendar_events'] = request_onboarding_data.get(
            'calendar_events', []
        )
        request.onboarding_data = json.dumps(onboarding_data)
        await session.commit()
        return make_id_output(request.id)
    onboarding_data['start'] = onboarding_data['start'].isoformat()
    onboarding_data['end'] = onboarding_data['end'].isoformat()
    onboarding_data['calendar_events'] = request_onboarding_data.get(
        'calendar_events', []
    )
    await validate_add_employee_request_data(
        onboarding_data=body.onboarding_data,
        settings=settings,
        calendar=calendar,
    )
    base_summary = (
        f'{onboarding_data["organization"]["label"]}: {employee_data["english_name"]}'
    )
    description = (
        body.onboarding_data.description + ('\n' + (settings.content or ''))
        if body.onboarding_data.description
        else (settings.content or '')
    )
    if calendar:
        for event in request_onboarding_data.get('calendar_events', []):
            calendar.update_event(
                uid=event['id'],
                start=body.onboarding_data.start,
                end=body.onboarding_data.end,
                summary=base_summary + ' onboarding',
                description=description,
            )
    if CONFIG.YOUTRACK_URL:
        youtrack_processor = YoutrackProcessor(session=session)
        target_project = next(
            project for project in settings.youtrack_projects if project['main']
        )
        if not target_project:
            raise HTTPException(
                HTTPStatus.CONFLICT,
                detail='No target YouTrack project in settings. Customize projects in request settings',
            )
        await youtrack_processor.update_issue(
            issue_id=request_onboarding_data['youtrack_issue_id'],
            user=curr_user,
            project_short_name=target_project['short_name'],
            summary=base_summary
            + f' - Start date: {employee_data["work_started"].strftime("%d/%m/%Y")}',
        )
        await youtrack_processor.create_issue_comment(
            issue_id=request_onboarding_data['youtrack_issue_id'],
            user=curr_user,
            text=f'Request updated by {curr_user.link_pararam}\n{request.link}',
        )
    request.onboarding_data = json.dumps(onboarding_data)
    employee_data['work_started'] = employee_data['work_started'].strftime('%Y-%m-%d')
    request.employee_data = employee_data
    request.updated = datetime.utcnow()
    if session.is_modified(request):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(HTTPStatus.CONFLICT, detail='duplicate') from err
    request_link = f'[{employee_data["english_name"]}]({CONFIG.PUBLIC_BASE_URL}/requests/add-employee/{request.id})'
    msg = f'Request to add employee {request_link} updated by {curr_user.link_pararam}'
    task_send_bbot_message.delay(settings.chat_id, msg, 'chat')
    return make_id_output(request.id)


@router.put('/{request_id}/approve')
async def approve_add_employee_request(  # pylint: disable=too-many-branches, too-many-locals
    request_id: int,
    body: AddEmployeeRequestApprove,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    user_roles = set(curr_user.roles)
    has_access = bool({'admin', 'hr', 'recruiter', 'super_hr'} & user_roles)
    user_hr_or_recruiter = bool({'hr', 'recruiter', 'super_hr'} & user_roles)
    if not has_access:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    if body.role == 'admin' and not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    if body.role == 'hr' and not user_hr_or_recruiter:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    request: m.AddEmployeeRequest | None = await session.scalar(
        sa.select(m.AddEmployeeRequest).where(m.AddEmployeeRequest.id == request_id)
    )
    if not request:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Request not found')
    if request.status in ('CANCELED', 'CLOSED', 'APPROVED'):
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail='Request cannot be approved')
    if body.role == 'hr':
        if user_hr_or_recruiter and request.approved_by_hr_id is not None:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, detail='Request already approved by HR'
            )
        request.approved_by_hr_id = curr_user.id
    if body.role == 'admin':
        if curr_user.is_admin and request.approved_by_admin_id is not None:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, detail='Request already approved by Support'
            )
        employee_data = request.employee_data
        work_started = datetime.strptime(
            employee_data['work_started'], '%Y-%m-%d'
        ).date()
        if work_started > datetime.today().date():
            raise HTTPException(
                HTTPStatus.CONFLICT,
                detail="You cannot approve the request earlier than the person's start work date",
            )
        request.approved_by_admin_id = curr_user.id
    full_approved = request.approved_by_admin_id and request.approved_by_hr_id
    if full_approved:
        request.status = 'APPROVED'
        onboarding_data_as_dict = json.loads(request.onboarding_data)
        onboarding_data_as_dict.pop('contacts', None)
        request.onboarding_data = json.dumps(onboarding_data_as_dict)
    employee = EmployeeCreate(**request.employee_data)
    request.updated = datetime.utcnow()
    if session.is_modified(request):
        try:
            if full_approved:
                await create_employee(body=employee, session=session, from_request=True)
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(HTTPStatus.CONFLICT, detail='duplicate') from err
    if CONFIG.DEV_MODE:
        return make_id_output(request.id)
    settings: m.EmployeeRequestSettings | None = await session.scalar(
        sa.select(m.EmployeeRequestSettings)
    )
    if not settings:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Settings not found')
    request_link = f'[{employee.english_name}]({CONFIG.PUBLIC_BASE_URL}/requests/add-employee/{request.id})'
    msg = f'Request to add employee {request_link} was approved. {request.created_by.link_pararam}'
    task_send_bbot_message.delay(settings.chat_id, msg, 'chat')
    return make_id_output(request.id)


@router.put('/{request_id}/cancel')
async def cancel_add_employee_request(
    request_id: int,
    session: AsyncSession = Depends(get_db_session),
    calendar: CalDAVClient | None = Depends(CalDAVClient),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    user_roles = set(curr_user.roles)
    has_access = bool({'admin', 'hr', 'recruiter'}.intersection(user_roles))
    if not has_access:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    request: m.AddEmployeeRequest | None = await session.scalar(
        sa.select(m.AddEmployeeRequest).where(m.AddEmployeeRequest.id == request_id)
    )
    if not request:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Request not found')
    if request.status in ('CANCELED', 'CLOSED', 'APPROVED'):
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail='Request cannot be canceled')
    onboarding_data_as_dict = json.loads(request.onboarding_data)
    onboarding_data_as_dict.pop('contacts', None)
    request.onboarding_data = json.dumps(onboarding_data_as_dict)
    request.status = 'CANCELED'
    request.updated = datetime.utcnow()
    await session.commit()
    if CONFIG.DEV_MODE:
        return make_id_output(request.id)
    settings: m.EmployeeRequestSettings | None = await session.scalar(
        sa.select(m.EmployeeRequestSettings)
    )
    if not settings:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Settings not found')
    if calendar:
        for event in onboarding_data_as_dict.get('calendar_events', []):
            calendar.delete_event(uid=event['id'])
    employee_data = request.employee_data
    request_link = f'[{employee_data["english_name"]}]({CONFIG.PUBLIC_BASE_URL}/requests/add-employee/{request.id})'
    msg = f'Request to add employee {request_link} was cancelled. {request.created_by.link_pararam}'
    task_send_bbot_message.delay(settings.chat_id, msg, 'chat')
    return make_id_output(request.id)
