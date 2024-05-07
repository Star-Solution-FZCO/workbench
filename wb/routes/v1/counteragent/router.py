import csv
import io
from datetime import datetime
from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import wb.models as m
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    BasePayloadOutput,
    ListFilterParams,
    SelectFieldInt,
    SelectOutput,
    SelectParams,
)
from wb.schemas.counteragents import get_counteragent_csv_fields
from wb.services.counteragent import get_counteragents
from wb.services.credentials import credentials_service
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results, resolve_db_id
from wb.utils.query import (
    make_id_output,
    make_list_output,
    make_select_output,
    make_success_output,
)
from wb.utils.search import filter_to_query, sort_to_query

from .schemas import (
    CounterAgentChangeStatus,
    CounterAgentCreate,
    CounterAgentCredentialsCollect,
    CounterAgentCredentialsCreate,
    CounterAgentCredentialsOut,
    CounterAgentCredentialsUpload,
    CounterAgentOut,
    CounterAgentUpdate,
)

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/counteragent', tags=['v1', 'counteragent'])


@router.get('/list')
async def list_counteragent(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[CounterAgentOut]:
    q = sa.select(m.CounterAgent).options(
        selectinload(m.CounterAgent.parent), selectinload(m.CounterAgent.agents)
    )
    available_fields = [
        'email',
        'english_name',
        'username',
        'group',
        'parent_id',
        'team_id',
        'team_required',
        'manager_id',
        'organization_id',
        'status',
    ]
    if query.filter:
        q = q.filter(
            filter_to_query(
                query.filter, m.CounterAgent, available_fields=available_fields
            )
        )  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.CounterAgent.english_name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.CounterAgent,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=[
                'email',
                'english_name',
                'username',
                'created',
                'status',
                'group',
                'team_required',
            ],
        )
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[CounterAgentOut.from_obj(obj) for obj in results.all()],
    )


@router.get('/select')
async def counteragent_select(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = sa.select(m.CounterAgent).where(
        m.CounterAgent.status == m.CounterAgentStatus.VALID
    )
    if query.search:
        q = q.filter(m.CounterAgent.english_name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by('english_name').limit(10))
    return make_select_output(
        items=[
            SelectFieldInt.from_obj(obj, label='english_name', value='id')
            for obj in results.all()
        ]
    )


@router.get('/export')
async def export_list(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    _, counteragents = await get_counteragents(
        counteagent_filter=query.filter,
        sort_by=query.sort_by,
        sort_direction=query.direction,  # type: ignore
        readable_fields=[
            'email',
            'english_name',
            'username',
            'contacts',
            'group',
            'parent_id',
            'team_id',
            'team_required',
            'manager_id',
            'organization_id',
            'status',
            'created',
        ],
        session=session,
    )
    output = io.StringIO()
    writer = csv.writer(output)
    rows = get_counteragent_csv_fields()
    writer.writerow([acl.name for acl in rows])
    for ca in counteragents:
        writer.writerow([acl.csv_getter(ca) for acl in rows])  # type: ignore
    export_media_type = 'text/csv'
    return StreamingResponse(iter([output.getvalue()]), media_type=export_media_type)


@router.get('/{counteragent_id}')
async def get_counteragent(
    counteragent_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[CounterAgentOut]:
    q = (
        sa.select(m.CounterAgent)
        .options(
            selectinload(m.CounterAgent.parent),
            selectinload(m.CounterAgent.agents),
        )
        .where(m.CounterAgent.id == counteragent_id)
    )
    obj: m.CounterAgent | None = await session.scalar(q)
    if not obj:
        raise HTTPException(404, detail='Counteragent not found')
    return make_success_output(payload=CounterAgentOut.from_obj(obj))


@router.post('')
async def create_counteragent(
    body: CounterAgentCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and curr_user.is_hr:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    try:
        if body.username:
            employee = await session.scalar(
                sa.select(m.Employee).where(m.Employee.account == body.username)
            )
            if employee:
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST,
                    detail='Employee with this username(account) already exists',
                )
        data = body.dict(exclude_unset=True)
        agents = data.pop('agents', [])
        parent = (
            await resolve_db_id(
                m.CounterAgent, data['parent']['value'], session=session
            )
            if body.parent
            else None
        )

        data['parent'] = parent
        data['manager'] = await resolve_db_id(
            m.Employee, body.manager.value, session=session
        )
        data['team'] = (
            await resolve_db_id(m.Team, body.team.value, session=session)
            if body.team
            else None
        )
        data['organization'] = (
            await resolve_db_id(
                m.Organization, body.organization.value, session=session
            )
            if body.organization
            else None
        )
        obj = m.CounterAgent(**data)
        session.add(obj)
        await session.flush()
        if parent:
            obj.manager_id = parent.manager_id
        counteragents = await session.scalars(
            sa.select(m.CounterAgent).where(
                m.CounterAgent.id.in_([agent['value'] for agent in agents])
            )
        )
        if body.apply_subagents:
            for agent in counteragents.all():
                agent.parent_id = obj.id
                agent.team_id = obj.team_id
                agent.organization_id = obj.organization_id
                agent.manager_id = obj.manager_id
                agent.schedule = obj.schedule
                agent.team_required = obj.team_required
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.put('/{counteragent_id}')
async def update_counteragent(  # pylint: disable=too-many-branches
    counteragent_id: int,
    body: CounterAgentUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj: m.CounterAgent | None = await session.scalar(
        sa.select(m.CounterAgent).where(m.CounterAgent.id == counteragent_id)
    )
    if not obj:
        raise HTTPException(404, detail='Counteragent not found')
    if body.parent and body.parent.value == obj.id:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            detail='Сounteragent cannot be a parent to itself',
        )
    if body.username and not curr_user.is_super_admin:
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            detail='Username cannot be changed',
        )
    data = body.dict(exclude_unset=True)
    agents = data.pop('agents', [])
    if obj.id in [agent['value'] for agent in agents]:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST,
            detail='An counteragent cannot be contained within itself',
        )
    if 'parent' in data:
        obj.parent_id = (
            await resolve_db_id(
                m.CounterAgent, data['parent']['value'], session=session
            )
            if data['parent']
            else None
        )
        data.pop('parent')
    if 'manager' in data:
        obj.manager = await resolve_db_id(
            m.Employee, data['manager']['value'], session=session
        )
        data.pop('manager')
    if 'team' in data:
        obj.team = (
            await resolve_db_id(m.Team, data['team']['value'], session=session)
            if data['team']
            else None
        )
        data.pop('team')
    if 'organization' in data:
        obj.organization = (
            await resolve_db_id(
                m.Organization, data['organization']['value'], session=session
            )
            if data['organization']
            else None
        )
        data.pop('organization')
    for k, v in data.items():
        setattr(obj, k, v)
    counteragents = await session.scalars(
        sa.select(m.CounterAgent).where(
            m.CounterAgent.id.in_([agent['value'] for agent in agents])
        )
    )
    if body.apply_subagents:
        for agent in counteragents.all():
            agent.parent_id = obj.id
            agent.team_id = obj.team_id
            agent.organization_id = obj.organization_id
            agent.manager_id = obj.manager_id
            agent.schedule = obj.schedule
            agent.team_required = obj.team_required
    try:
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


async def change_counteragent_status(
    status: m.CounterAgentStatus,
    body: CounterAgentChangeStatus,
    session: AsyncSession,
) -> None:
    curr_user = current_employee()
    cannot_change = not curr_user.is_admin and not curr_user.is_hr
    results: m.CounterAgent | None = await session.scalars(
        sa.select(m.CounterAgent)
        .filter(
            m.CounterAgent.id.in_(body.agents),
            m.CounterAgent.status != m.CounterAgentStatus.INVALID,
        )
        .options(selectinload(m.CounterAgent.agents))
    )
    agents = results.all()
    if curr_user.id not in [agent.manager_id for agent in agents] or cannot_change:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    for agent in agents:
        agent.status = status
        if body.apply_subagents:
            for subagent in agent.agents.all():
                subagent.status = status
    await session.commit()


@router.post('/invalidate')
async def invalidate_counteragent(
    body: CounterAgentChangeStatus,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    await change_counteragent_status(m.CounterAgentStatus.INVALID, body, session)
    return make_success_output(payload='success')


@router.post('/restore')
async def restore_counteragent(
    body: CounterAgentChangeStatus,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    await change_counteragent_status(m.CounterAgentStatus.VALID, body, session)
    return make_success_output(payload='success')


@router.post('/suspend')
async def suspend_counteragent(
    body: CounterAgentChangeStatus,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    await change_counteragent_status(m.CounterAgentStatus.SUSPENDED, body, session)
    return make_success_output(payload='success')


@router.post('/credentials/collect')
async def collect_credentials(
    body: CounterAgentCredentialsCollect,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj: m.CounterAgentCredentials | None = await session.scalar(
        sa.select(m.CounterAgentCredentials).where(
            m.CounterAgentCredentials.request_id == body.rid
        )
    )
    if not obj:
        raise HTTPException(404, detail='Credentials not found')
    if obj.status == m.CounterAgentCredentialsStatus.COLLECTED:
        raise HTTPException(400, detail='Credentials already collected')
    active_credentials = await session.scalar(
        sa.select(m.CounterAgentCredentials)
        .where(
            m.CounterAgentCredentials.counteragent_id == obj.counteragent_id,
            m.CounterAgentCredentials.status == m.CounterAgentCredentialsStatus.ACTIVE,
            m.CounterAgentCredentials.request_id == obj.request_id,
        )
        .where(m.CounterAgentCredentials.id != obj.id)
    )
    if active_credentials:
        raise HTTPException(
            400, detail='Counteragent already has active credentials with the same RID'
        )
    new_bundle = obj.bundle.copy()
    new_bundle.update(body.credentials)
    obj.bundle = new_bundle
    obj.status = m.CounterAgentCredentialsStatus.COLLECTED
    obj.updated = datetime.utcnow()
    await session.commit()
    return make_success_output(payload='success')


@router.get('/credentials/list')
async def list_counteragent_credentials(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[CounterAgentCredentialsOut]:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    q = sa.select(m.CounterAgentCredentials)
    if query.filter:
        q = q.filter(
            filter_to_query(
                query.filter,
                m.CounterAgentCredentials,
                available_fields=['status', 'counteragent_id'],
            )
        )  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.CounterAgentCredentials.created,)
    if query.sort_by:
        sorts = sort_to_query(
            m.CounterAgentCredentials,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=[
                'status',
                'created',
                'updated',
            ],
        )
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[CounterAgentCredentialsOut.from_obj(obj) for obj in results.all()],
    )


@router.get('/credentials/{credentials_id}')
async def get_counteragent_credentials(
    credentials_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[CounterAgentCredentialsOut]:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    q = sa.select(m.CounterAgentCredentials).where(m.CounterAgent.id == credentials_id)
    obj: m.CounterAgentCredentials | None = await session.scalar(q)
    if not obj:
        raise HTTPException(404, detail='Credentials not found')
    return make_success_output(payload=CounterAgentCredentialsOut.from_obj(obj))


@router.post('/{counteragent_id}/credentials')
async def create_credentials(
    counteragent_id: int,
    body: CounterAgentCredentialsCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj: m.CounterAgent | None = await session.scalar(
        sa.select(m.CounterAgent).where(m.CounterAgent.id == counteragent_id)
    )
    data = body.model_dump()
    if not obj:
        raise HTTPException(404, detail='Counteragent not found')
    res = await credentials_service.arm_credentials(
        notifications=data['notifications'],
        subject=f'CN={obj.username}',
        bundle=data['bundle'],
        name=obj.english_name,
        ca=data['ca'],
    )
    rid = res.get('payload', {}).get('rid')
    if not rid:
        raise HTTPException(500, detail='Error creating credentials')
    credentials = m.CounterAgentCredentials(
        counteragent_id=counteragent_id,
        created_by_id=curr_user.id,
        request_id=rid,
        notifications=data['notifications'],
        bundle={k: None for k in data['bundle'].keys()},
    )
    session.add(credentials)
    await session.commit()
    return make_success_output(payload={'rid': rid})


@router.post('/credentials/{counteragent_id}/upload')
async def upload_credentials(
    counteragent_id: int,
    body: CounterAgentCredentialsUpload,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj: m.CounterAgent | None = await session.scalar(
        sa.select(m.CounterAgent).where(m.CounterAgent.id == counteragent_id)
    )
    if not obj:
        raise HTTPException(404, detail='Counteragent not found')
    bundle = {body.type: body.url}
    credentials = m.CounterAgentCredentials(
        counteragent_id=counteragent_id,
        created_by_id=curr_user.id,
        status=m.CounterAgentCredentialsStatus.UPLOADED,
        bundle=bundle,
    )
    session.add(credentials)
    await session.commit()
    return make_success_output(payload='success')
