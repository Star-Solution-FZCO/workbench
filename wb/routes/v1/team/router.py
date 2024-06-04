# pylint: skip-file
# skip this file from pylint because of 'Exception on node <Compare l.154 at 0x7f1e1cb8ebd0>'
# pylint bug: https://github.com/pylint-dev/pylint/issues/7680
import csv
import io
import pickle
from datetime import date
from http import HTTPStatus
from typing import cast

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import wb.models as m
from wb.acl import list_employee_readable_fields
from wb.db import get_db_session
from wb.routes.v1.counteragent.schemas import CounterAgentOut
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    BasePayloadOutput,
    EmployeePublicOutPrototype,
    ListFilterParams,
    SelectFieldInt,
    SelectOutput,
    SelectParams,
    get_employee_csv_fields,
    get_employee_output_model_class,
)
from wb.services import (
    get_employees,
    get_employees_days_status,
    get_teams_members_history,
)
from wb.services.counteragent import list_counteragents_by_team
from wb.utils.current_user import current_employee
from wb.utils.db import resolve_db_id, resolve_db_ids, resolve_db_ids_to_dict
from wb.utils.query import (
    make_id_output,
    make_list_output,
    make_select_output,
    make_success_output,
)
from wb.utils.search import filter_to_query, sort_to_query

from .schemas import (
    TeamCreate,
    TeamHierarchyOut,
    TeamHistoryRecord,
    TeamMemberOut,
    TeamOut,
    TeamUpdate,
)
from .utils import build_team_hierarchy

__all__ = ('router',)

router = APIRouter(prefix='/api/v1/team', tags=['v1', 'team'])


@router.get('/list')
async def list_team(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[TeamOut]:
    flt = sa.sql.true()
    if query.filter:
        flt = filter_to_query(
            query.filter,
            m.Team,
            available_fields=['name', 'key', 'is_archived', 'tags'],
        )  # type: ignore
    sorts = (m.Team.name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.Team,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['name', 'key'],
        )
    count_result = await session.execute(
        sa.select(sa.func.count()).select_from(m.Team).filter(flt)
    )
    if (count := count_result.scalar()) is None:
        count = 0
    results = await session.scalars(
        sa.select(m.Team)
        .filter(flt)
        .options(selectinload(m.Team.head_team), selectinload(m.Team.sub_teams))
        .order_by(*sorts)
        .limit(query.limit)
        .offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[TeamOut.from_obj(r) for r in results.all()],
    )


@router.get('/select')
async def team_select(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = sa.select(m.Team).where(m.Team.is_archived.is_(False))
    if query.search:
        q = q.filter(
            sa.or_(
                m.Team.key.ilike(f'%{query.search}%'),
                m.Team.name.ilike(f'%{query.search}%'),
            )
        )
    results = await session.scalars(q.order_by('name').limit(10))
    return make_select_output(
        items=[
            SelectFieldInt.from_obj(obj, label='name', value='id')
            for obj in results.all()
        ]
    )


@router.get('/hierarchy')
async def get_team_hierarchy(
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[TeamHierarchyOut | None]:
    raw_teams = await session.scalars(
        sa.select(m.Team)
        .where(m.Team.is_archived.is_(False))
        .options(selectinload(m.Team.sub_teams))
    )
    teams = raw_teams.all()
    if not teams:
        return make_success_output(payload=None)
    team_hierarchy = build_team_hierarchy(teams)
    return make_success_output(payload=TeamHierarchyOut.from_obj(team_hierarchy))


@router.get('/{team_id}')
async def get_team(
    team_id: int, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[TeamOut]:
    team = await session.scalar(
        sa.select(m.Team)
        .where(m.Team.id == team_id)
        .options(selectinload(m.Team.head_team), selectinload(m.Team.sub_teams))
    )
    if not team:
        raise HTTPException(404, detail='Not Found')
    return make_success_output(payload=TeamOut.from_obj(team))


@router.put('/{team_id}')
async def update_team(
    team_id: int, body: TeamUpdate, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    team = await session.scalar(
        sa.select(m.Team)
        .where(m.Team.id == team_id)
        .options(selectinload(m.Team.sub_teams))
    )
    if not team:
        raise HTTPException(404, detail='Not Found')
    data = {}
    for k in body.dict(exclude_unset=True).keys():
        data[k] = getattr(body, k)
    if 'manager' in data:
        try:
            data['manager'] = await resolve_db_id(
                m.Employee, data['manager'].value, session=session
            )
        except NoResultFound as err:
            raise HTTPException(404, detail='Manager not found') from err

    if 'head_team' in data:
        try:
            data['head_team'] = (
                await resolve_db_id(m.Team, data['head_team'].value, session=session)
                if data['head_team']
                else None
            )
        except NoResultFound as err:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, detail='head team not found'
            ) from err
        if data['head_team'] and data['head_team'].id == team.id:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, detail='Team can not be subordinate to itself'
            )
    # TODO: check cycle in team hierarchy
    if 'tags' in data:
        try:
            data['tags'] = await resolve_db_ids(
                m.TeamTag, [tag.value for tag in data['tags']], session=session
            )
        except NoResultFound as err:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, detail='team tags not resolved correctly'
            ) from err
    for k, v in data.items():
        setattr(team, k, v)
    if session.is_modified(team):
        await session.commit()
    return make_id_output(team.id)


@router.post('')
async def create_team(
    body: TeamCreate, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    try:
        manager = await resolve_db_id(m.Employee, body.manager.value, session=session)
        head_team = (
            await resolve_db_id(m.Team, body.head_team.value, session=session)
            if body.head_team
            else None
        )
        tags = []
        if body.tags:
            tags = await resolve_db_ids(
                m.TeamTag, [tag.value for tag in body.tags], session=session
            )
        obj = m.Team(
            name=body.name,
            key=body.name,
            description=body.description,
            manager=manager,
            head_team=head_team,
            tags=tags,
        )
        session.add(obj)
        await session.commit()
    except NoResultFound as err:
        raise HTTPException(422, detail=str(err)) from err
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj_id=obj.id)


async def _get_team_history(
    team: m.Team,
    session: AsyncSession,
) -> list[TeamHistoryRecord]:
    results = []
    employees_team_changes_all = await get_teams_members_history(session=session)
    employees_team_changes = [
        rec for rec in employees_team_changes_all if rec.team_id == team.id
    ]
    employees = cast(
        dict[int, m.Employee],
        await resolve_db_ids_to_dict(
            m.Employee,
            [rec.employee_id for rec in employees_team_changes],
            session=session,
        ),
    )
    for rec in employees_team_changes:
        results.append(
            TeamHistoryRecord(
                action=rec.action,
                time=rec.time,
                user=TeamMemberOut.from_obj(employees[rec.employee_id]),
            )
        )
    team_changes = await session.scalars(
        sa.select(m.AuditEntry).where(
            m.AuditEntry.class_name == m.Team.__name__,
            m.AuditEntry.object_id == team.id,
            sa.or_(
                m.AuditEntry.fields.any('name'), m.AuditEntry.fields.any('manager_id')
            ),
        )
    )
    for rec in team_changes.all():
        unpacked_data = pickle.loads(rec.data)  # type: ignore  # nosec pickle
        if manager_changes := unpacked_data.get('manager_id'):
            u = (
                cast(
                    'm.Employee',
                    await resolve_db_id(
                        m.Employee, manager_changes['added'][0], session=session
                    ),
                )
                if manager_changes['added'][0] is not None
                else None
            )
            results.append(
                TeamHistoryRecord(
                    action='set team lead',
                    time=rec.time,
                    user=TeamMemberOut.from_obj(u) if u else None,
                )
            )
        if name_changes := unpacked_data.get('name'):
            results.append(
                TeamHistoryRecord(
                    action='set name', time=rec.time, name=name_changes['added'][0]
                )
            )
    return sorted(results, key=lambda r: r.time)


@router.get('/{team_id}/history')
async def get_team_history(
    team_id: int, session: AsyncSession = Depends(get_db_session)
) -> BaseListOutput[TeamHistoryRecord]:
    team = await session.scalar(sa.select(m.Team).where(m.Team.id == team_id))
    if not team:
        raise HTTPException(404, detail='Not Found')
    results = await _get_team_history(team, session=session)
    return make_list_output(count=len(results), limit=0, offset=0, items=results)


@router.get('/{team_id}/history/export')
async def export_team_history(
    team_id: int, session: AsyncSession = Depends(get_db_session)
) -> StreamingResponse:
    team = await session.scalar(sa.select(m.Team).where(m.Team.id == team_id))
    if not team:
        raise HTTPException(404, detail='Not Found')
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(TeamHistoryRecord._CSV_ROWS)
    for res in await _get_team_history(team, session=session):
        writer.writerow(res.to_csv_row())
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv')


@router.get('/{team_id}/members', response_model=None)
async def get_team_members(
    team_id: int, session: AsyncSession = Depends(get_db_session)
) -> BaseListOutput['EmployeePublicOutPrototype']:
    team: m.Team | None = await session.scalar(
        sa.select(m.Team).where(m.Team.id == team_id)
    )
    if not team:
        raise HTTPException(404, detail='Not Found')
    count, employees = await get_employees(
        employee_filter=f'team_id:{team.id}',
        readable_fields=list_employee_readable_fields(),
        session=session,
    )
    today = date.today()
    employees_days = await get_employees_days_status(
        employees, today, today, session=session
    )
    items = []
    for emp in employees:
        output_model_class = get_employee_output_model_class(emp)
        emp_out = output_model_class.from_obj(
            emp,
            today_schedule_status=employees_days[emp.id][today],
        )
        items.append(emp_out)
    return make_list_output(
        count=count,
        limit=count,
        offset=0,
        items=items,
    )


@router.get('/{team_id}/counteragents')
async def get_team_counteragents(
    team_id: int, session: AsyncSession = Depends(get_db_session)
) -> BaseListOutput[CounterAgentOut]:
    team: m.Team | None = await session.scalar(
        sa.select(m.Team).where(m.Team.id == team_id)
    )
    if not team:
        raise HTTPException(404, detail='Not Found')
    count, counteragents = await list_counteragents_by_team(
        team_id=team.id, session=session
    )
    items = [CounterAgentOut.from_obj(obj) for obj in counteragents]
    return make_list_output(
        count=count,
        limit=count,
        offset=0,
        items=items,
    )


@router.get('/{team_id}/members/export')
async def export_team_members(
    team_id: int, session: AsyncSession = Depends(get_db_session)
) -> StreamingResponse:
    team = await session.scalar(sa.select(m.Team).where(m.Team.id == team_id))
    if not team:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Not Found')
    _, employees = await get_employees(
        employee_filter=f'team_id:{team.id}',
        readable_fields=list_employee_readable_fields(),
        session=session,
    )
    fields = {emp.id: get_employee_csv_fields(emp) for emp in employees}
    _seen = set()
    all_fields = list(
        k
        for emp_fields in fields.values()
        for k in emp_fields
        if not (k in _seen or _seen.add(k))  # type: ignore[func-returns-value]
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(all_fields)
    for emp in employees:
        row = []
        for field in all_fields:
            if field not in fields[emp.id]:
                row.append('N/A')
            else:
                row.append(fields[emp.id][field].csv_getter(emp))
        writer.writerow(row)
    export_media_type = 'text/csv'
    return StreamingResponse(iter([output.getvalue()]), media_type=export_media_type)


@router.delete('/{team_id}')
async def archive_team(
    team_id: int, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    team = await session.scalar(
        sa.select(m.Team)
        .where(m.Team.id == team_id)
        .options(selectinload(m.Team.sub_teams))
    )
    if not team:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Not Found')
    curr_user = current_employee()
    if not curr_user.is_super_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    if team.sub_teams:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Team has subordinate teams')
    if team.is_archived:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Already archived')
    count_result = await session.execute(
        sa.select(sa.func.count())
        .select_from(m.Employee)
        .where(m.Employee.team_id == team.id)
    )
    if count_result.scalar():
        raise HTTPException(
            HTTPStatus.CONFLICT,
            detail='There are employees in this team, it can not be archived',
        )

    team.is_archived = True
    team.manager_id = None
    team.head_team_id = None
    team.tags = []
    await session.commit()
    return make_id_output(team.id)


@router.put('/{team_id}/restore')
async def restore_team(
    team_id: int, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    team = await session.scalar(sa.select(m.Team).where(m.Team.id == team_id))
    if not team:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Not Found')
    curr_user = current_employee()
    if not curr_user.is_super_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    if not team.is_archived:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Not archived')
    team.is_archived = False
    await session.commit()
    return make_id_output(team.id)
