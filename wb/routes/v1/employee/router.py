import asyncio
import csv
import io
import os
import re
import secrets
from datetime import date, datetime, timedelta
from http import HTTPStatus
from typing import Any, Dict

import jwt
import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import wb.models as m
from wb.acl import (
    is_employee_field_editable,
    is_employee_field_viewable,
    list_employee_readable_fields,
)
from wb.config import CONFIG, AuthModeT
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    BasePayloadOutput,
    EmployeePublicOutPrototype,
    FieldHistoryItem,
    ListFilterParams,
    ModelFieldMetadata,
    SelectEmployeeField,
    SelectField,
    SelectOutput,
    SelectParams,
    ShortEmployeeOut,
    SuccessOutput,
    get_employee_csv_fields,
    get_employee_output_model_class,
)
from wb.services import (
    get_employee_days_status,
    get_employees,
    get_employees_days_status,
)
from wb.services.done_tasks import get_done_task_score
from wb.services.employee import check_similar_usernames
from wb.services.notifications import (
    Notification,
    NotificationDestinationEmployee,
    NotificationDestinationRole,
    NotificationDestinationTeam,
    NotificationMessage,
)
from wb.tasks.send import task_send_email
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results, resolve_db_id, resolve_db_ids
from wb.utils.email import check_email_domain
from wb.utils.notifications import send_notification_to_people_project
from wb.utils.photo import generate_default_photo, upload_photo
from wb.utils.query import (
    get_select_value,
    make_id_output,
    make_list_output,
    make_select_output,
    make_success_output,
)
from wb.utils.search import sort_to_query

from .schemas import (
    EmployeeCreate,
    EmployeeDaysStatusOut,
    EmployeeDayStatusOut,
    EmployeeHierarchyOut,
    EmployeeTMKeyUpdateOut,
    EmployeeUpdate,
)
from .utils import (
    EmployeeIDParamT,
    build_hierarchy,
    get_manager_chain,
    get_subordinates_on_update_query,
    resolve_employee_id_param,
)

__all__ = ('router',)

router = APIRouter(prefix='/api/v1/employee', tags=['v1', 'employee'])


async def _get_employee_day_status(
    emp: 'm.Employee', start: date, end: date, session: AsyncSession
) -> Dict[date, EmployeeDayStatusOut]:
    results = await get_employee_days_status(emp, start, end, session=session)
    return {k: EmployeeDayStatusOut(type=v) for k, v in results.items()}


async def create_employee(
    body: EmployeeCreate, session: AsyncSession, from_request: bool = False
) -> BaseModelIdOutput:
    if not check_email_domain(body.email):
        raise HTTPException(
            HTTPStatus.UNPROCESSABLE_ENTITY, detail='email domain not allowed'
        )
    if similar_username := await check_similar_usernames(
        body.account,
        session=session,
        exclude_account=body.account if from_request else None,
    ):
        raise HTTPException(
            HTTPStatus.CONFLICT,
            detail=f'Username {body.account} is similar to {similar_username}',
        )
    holiday_set = None
    try:
        data: Dict[str, Any] = dict(body)
        data['managers'] = await resolve_db_ids(
            m.Employee, map(get_select_value, data.get('managers', [])), session=session
        )
        data['mentors'] = await resolve_db_ids(
            m.Employee, map(get_select_value, data.get('mentors', [])), session=session
        )
        data['roles'] = list(map(get_select_value, data.get('roles', [])))
        data['team'] = (
            await resolve_db_id(m.Team, body.team.value, session=session)
            if body.team
            else None
        )
        data['position'] = (
            await resolve_db_id(m.Position, body.position.value, session=session)
            if body.position
            else None
        )
        if isinstance(data['work_started'], datetime):
            data['work_started'] = data['work_started'].date()
        data['probation_period_started'] = data['work_started']
        if data['birthday']:
            if isinstance(data['birthday'], datetime):
                data['birthday'] = data['birthday'].date()
        data['pool'] = (
            await resolve_db_id(m.EmployeePool, data['pool'].value, session=session)
            if data['pool']
            else None
        )
        holiday_set = data.pop('holiday_set')
    except NoResultFound as err:
        raise HTTPException(422, detail=str(err)) from err
    try:
        obj = m.Employee(**data)
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err

    default_photo = generate_default_photo(obj.id, obj.english_name)
    photo_path = await upload_photo(f'{obj.id}.jpg', default_photo)
    obj.photo = photo_path
    await session.commit()

    default_holiday_set: 'm.HolidaySet | None' = await session.scalar(
        sa.select(m.HolidaySet).where(m.HolidaySet.is_default.is_(True))
    )
    schedule = m.EmployeeSchedule(
        employee_id=obj.id,
        start=data['work_started'],
        holiday_set_id=holiday_set.value if holiday_set else default_holiday_set.id,
    )
    session.add(schedule)
    tm_obj = m.EmployeeTM(
        employee_id=obj.id,
        key_hash=m.EmployeeTM.hash_key(secrets.token_urlsafe(16)),
    )
    session.add(tm_obj)
    await session.commit()
    subj = f'New employee {obj.english_name}'
    txt = (
        f'<a href="{CONFIG.PUBLIC_BASE_URL}/employees/view/{obj.id}">{obj.english_name}</a><br>'
        f'Email: {obj.email}<br>'
        f'Team: {obj.team.name if obj.team else "---"}'
    )
    await send_notification_to_people_project(subj, txt)
    return make_id_output(obj.id)


@router.get('/list', response_model=None)
async def list_employees(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput['EmployeePublicOutPrototype']:
    count, employees = await get_employees(
        employee_filter=query.filter,
        limit=query.limit,
        offset=query.offset,
        sort_by=query.sort_by,
        sort_direction=query.direction,  # type: ignore
        readable_fields=list_employee_readable_fields(),
        session=session,
    )
    today = date.today()
    employees_days = await get_employees_days_status(
        employees, today, today, session=session
    )
    employees_done_task_scores = await get_done_task_score(employees, session=session)
    items = []
    for emp in employees:
        output_model_class = get_employee_output_model_class(emp)
        emp_out = output_model_class.from_obj(
            emp,
            today_schedule_status=employees_days[emp.id][today],
            done_task_score=employees_done_task_scores[emp.id],
        )
        items.append(emp_out)
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=items,
    )


@router.get('/hierarchy')
async def get_employee_full_hierarchy(
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[EmployeeHierarchyOut]:
    query = (
        sa.select(m.Employee)
        .filter(m.Employee.active.is_(True))
        .options(selectinload(m.Employee.managers))
        .order_by(m.Employee.english_name)
    )
    results = await session.scalars(query)
    hierarchy = build_hierarchy(results.all())
    return make_success_output(EmployeeHierarchyOut.from_obj(hierarchy))


@router.get('/list/day_status')
async def list_employees_day_status(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[EmployeeDaysStatusOut]:
    count, employees = await get_employees(
        employee_filter=query.filter,
        limit=query.limit,
        offset=query.offset,
        sort_by=query.sort_by,
        sort_direction=query.direction,  # type: ignore
        readable_fields=list_employee_readable_fields(),
        session=session,
    )
    results_raw = await asyncio.gather(
        *[
            _get_employee_day_status(emp, start, end, session=session)
            for emp in employees
        ]
    )
    results = [
        EmployeeDaysStatusOut(employee=ShortEmployeeOut.from_obj(emp), dates=res)
        for emp, res in zip(employees, results_raw)
    ]
    return make_list_output(
        count=count, limit=query.limit, offset=query.offset, items=results
    )


@router.get('/export')
async def export_list(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    _, employees = await get_employees(
        employee_filter=query.filter,
        sort_by=query.sort_by,
        sort_direction=query.direction,  # type: ignore
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


@router.get('/select')
async def employee_select(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = sa.select(m.Employee).where(m.Employee.active.is_(True))
    if query.search:
        q = q.filter(
            sa.or_(
                m.Employee.english_name.ilike(f'%{query.search}%'),
                m.Employee.account.ilike(f'%{query.search}%'),
            )
        )
    results = await session.scalars(q.order_by('english_name').limit(10))
    return make_select_output(
        items=[SelectEmployeeField.from_obj(emp) for emp in results.all()]
    )


@router.get('/{employee_id}', response_model=None)
async def employee_get(
    employee_id: EmployeeIDParamT, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput['EmployeePublicOutPrototype']:
    emp = await resolve_employee_id_param(employee_id, session=session)
    output_model_class = get_employee_output_model_class(emp)
    fields_metadata = [
        ModelFieldMetadata(
            name=field, editable=is_employee_field_editable(field, emp), label=None
        )
        for field in output_model_class.__fields__
    ]
    today = date.today()
    day_types_raw = await get_employee_days_status(emp, today, today, session=session)
    done_task_scores = await get_done_task_score([emp], session=session)
    return make_success_output(
        payload=output_model_class.from_obj(
            emp,
            today_schedule_status=day_types_raw[today],
            done_task_score=done_task_scores[emp.id],
        ),
        metadata={'fields': fields_metadata},
    )


@router.post('')
async def employee_create(
    body: EmployeeCreate, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    if not current_employee().is_super_admin:
        raise HTTPException(403, detail='Forbidden')
    output = await create_employee(body=body, session=session)
    return output


@router.get('/{employee_id}/history')
async def get_history(
    employee_id: EmployeeIDParamT,
    field: str,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[FieldHistoryItem]:
    emp = await resolve_employee_id_param(employee_id, session=session)
    if not is_employee_field_viewable(field, emp):
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    q = sa.select(m.AuditEntry).where(
        m.AuditEntry.table_name == m.Employee.__tablename__,
        m.AuditEntry.object_id == emp.id,
        m.AuditEntry.fields.any(field),
    )
    sorts = (m.AuditEntry.time.desc(),)
    if query.sort_by:
        sorts = sort_to_query(
            m.AuditEntry, query.sort_by, query.direction, available_sort_fields=['time']
        )
    cnt = await count_select_query_results(q, session)
    results = await session.scalars(
        q.order_by(*sorts).offset(query.offset).limit(query.limit)
    )
    return make_list_output(
        count=cnt,
        limit=query.limit,
        offset=query.offset,
        items=[FieldHistoryItem.from_obj(r, field=field) for r in results.all()],
    )


@router.get('/{employee_id}/hierarchy')
async def get_employee_hierarchy(
    employee_id: EmployeeIDParamT,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[EmployeeHierarchyOut]:
    emp = await resolve_employee_id_param(employee_id, session=session)
    subordinates_raw = await session.scalars(
        sa.select(m.Employee)
        .filter(
            m.Employee.active.is_(True),
            m.Employee.managers.any(m.Employee.id == emp.id),
        )
        .options(selectinload(m.Employee.managers))
    )
    subordinates = subordinates_raw.all()
    managers = await get_manager_chain(employee_id, session)
    employees = managers + subordinates
    hierarchy = build_hierarchy(employees)
    return make_success_output(EmployeeHierarchyOut.from_obj(hierarchy))


@router.delete('/{employee_id}')
async def dismiss_employee(
    employee_id: EmployeeIDParamT, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    if not current_employee().is_admin:
        raise HTTPException(403, detail='Forbidden')
    emp = await resolve_employee_id_param(employee_id, session=session)
    if emp.work_ended:
        raise HTTPException(422, detail='user already dismissed')
    emp.work_ended = datetime.today()
    emp.active = False
    emp.team = None
    emp.team_position = None
    emp.organization = None
    emp.cooperation_type = None
    emp.mentors = []
    mentees = await session.scalars(
        sa.select(m.Employee)
        .where(m.Employee.mentors.any(m.Employee.id == emp.id))
        .options(selectinload(m.Employee.mentors))
    )
    for u in mentees.all():
        u.mentors.remove(emp)
    emp.managers = []
    subordinates = await session.scalars(
        sa.select(m.Employee)
        .where(m.Employee.managers.any(m.Employee.id == emp.id))
        .options(
            selectinload(m.Employee.managers),
            selectinload(m.Employee.team).selectinload(m.Team.manager),
        )
    )
    orphaned_subordinates: list[m.Employee] = []
    for u in subordinates.all():
        u.managers.remove(emp)
        if not u.managers:
            orphaned_subordinates.append(u)
    emp.projects = []
    emp.watchers = []
    watched = await session.scalars(
        sa.select(m.Employee)
        .where(m.Employee.watchers.any(m.Employee.id == emp.id))
        .options(selectinload(m.Employee.watchers))
    )
    for u in watched.all():
        u.watchers.remove(emp)
    groups = await session.scalars(
        sa.select(m.Group)
        .where(m.Group.members.any(m.Employee.id == emp.id))
        .options(selectinload(m.Group.members))
    )
    for group in groups.all():
        group.members.remove(emp)
    subj = f'Work ended for {emp.english_name}'
    pararam_str = f'(@{emp.pararam})' if emp.pararam else ''
    txt = (
        f'<a href="{CONFIG.PUBLIC_BASE_URL}/employees/view/{emp.id}">{emp.english_name}</a> {pararam_str}<br>'
        f'Work ended at: {emp.work_ended}'
    )
    await session.commit()
    if orphaned_subordinates:
        orphans_by_teams: dict[int, tuple[m.Team, list[m.Employee]]] = {}
        for u in orphaned_subordinates:
            if not u.team_id or not u.team:
                continue
            if u.team_id not in orphans_by_teams:
                orphans_by_teams[u.team_id] = (u.team, [])
            orphans_by_teams[u.team_id][1].append(u)
        await Notification(
            items=[
                NotificationMessage(
                    destination=NotificationDestinationTeam.TEAM_LEAD,
                    related_object=team,
                    msg='\n'.join(
                        [
                            f'Since {emp.link_pararam} was dismissed:',
                            *[
                                f"{u.link_pararam} don't have any managers"
                                for u in orphans
                            ],
                        ]
                    ),
                )
                for team, orphans in orphans_by_teams.values()
            ]
        ).send()
    await send_notification_to_people_project(subj, txt)
    return make_id_output(emp.id)


@router.put('/{employee_id}')
async def employee_update(
    employee_id: EmployeeIDParamT,
    body: EmployeeUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    # pylint: disable=too-many-branches, too-many-statements, too-many-locals
    emp = await resolve_employee_id_param(employee_id, session=session)
    data = {}
    notification = Notification()
    people_project_notifications = []
    for k in body.dict(exclude_unset=True).keys():
        if not is_employee_field_editable(k, emp):
            raise HTTPException(403, detail=f'you not allowed to change "{k}"')
        data[k] = getattr(body, k)
    subordinates_query = await get_subordinates_on_update_query(session=session)
    subordinates_raw = await session.scalars(subordinates_query)
    subordinates_ids = {sub.id for sub in subordinates_raw.all()}
    if 'account' in data:
        if similar_username := await check_similar_usernames(
            data['account'],
            session=session,
            exclude_account=emp.account,
        ):
            raise HTTPException(
                HTTPStatus.CONFLICT,
                detail=f'Username {data["account"]} is similar to {similar_username}',
            )
    if 'email' in data and not check_email_domain(data['email']):
        raise HTTPException(
            HTTPStatus.UNPROCESSABLE_ENTITY, detail='email domain not allowed'
        )
    if 'managers' in data:
        data['managers'] = await resolve_db_ids(
            m.Employee, map(get_select_value, data.get('managers', [])), session=session
        )
        if {man.id for man in data['managers']} - subordinates_ids:
            raise HTTPException(422, "you can't set these managers")
    if 'watchers' in data:
        data['watchers'] = await resolve_db_ids(
            m.Employee, map(get_select_value, data.get('watchers', [])), session=session
        )
    if 'mentors' in data:
        data['mentors'] = await resolve_db_ids(
            m.Employee, map(get_select_value, data.get('mentors', [])), session=session
        )
        if {man.id for man in data['mentors']} - subordinates_ids:
            raise HTTPException(422, "you can't set these mentors")
    if 'team' in data:
        new_team_id = data['team'].value if data['team'] else None
        data['team'] = (
            await resolve_db_id(m.Team, data['team'].value, session=session)
            if data['team']
            else None
        )
        if new_team_id != emp.team_id:
            subj = f'Team changed for {emp.english_name}'
            pararam_str = f'(@{emp.pararam})' if emp.pararam else ''
            txt = (
                f'<a href="{CONFIG.PUBLIC_BASE_URL}/employees/view/{emp.id}">{emp.english_name}</a> {pararam_str}<br>'
                f'Previous team: {emp.team.name if emp.team else "---"}<br>'
                f'Current team: {data["team"].name if data["team"] else "---"}'
            )
            people_project_notifications.append((subj, txt))
    if 'organization' in data:
        data['organization'] = (
            await resolve_db_id(
                m.Organization, data['organization'].value, session=session
            )
            if data['organization']
            else None
        )
    if 'cooperation_type' in data:
        data['cooperation_type'] = (
            await resolve_db_id(
                m.CooperationType, data['cooperation_type'].value, session=session
            )
            if data['cooperation_type']
            else None
        )
    if 'position' in data:
        data['position'] = (
            await resolve_db_id(m.Position, data['position'].value, session=session)
            if data['position']
            else None
        )
    if 'work_started' in data:
        if isinstance(data['work_started'], datetime):
            data['work_started'] = data['work_started'].date()
    if 'roles' in data:
        data['roles'] = list(map(get_select_value, data.get('roles', [])))
    if 'birthday' in data:
        if isinstance(data['birthday'], datetime):
            data['birthday'] = data['birthday'].date()
    if 'grade' in data:
        data['grade_reason'] = data['grade'].reason
        new_grade = data['grade'].grade.value if data['grade'].grade else None
        data['grade'] = new_grade
        data['grade_updated'] = datetime.utcnow()
        if emp.grade != new_grade:
            msg = f'Grade changed to {new_grade if new_grade else "n/a"} for {emp.link_pararam}'
            notification.items.extend(
                [
                    NotificationMessage(
                        destination=NotificationDestinationEmployee.SELF,
                        msg=msg,
                        related_object=emp,
                    ),
                    NotificationMessage(
                        destination=NotificationDestinationEmployee.MANAGERS,
                        msg=msg,
                        related_object=emp,
                    ),
                    NotificationMessage(
                        destination=NotificationDestinationEmployee.TEAM_LEAD,
                        msg=msg,
                        related_object=emp,
                    ),
                    NotificationMessage(
                        destination=NotificationDestinationRole.MEMBERS,
                        msg=msg,
                        related_object='hr',
                    ),
                    NotificationMessage(
                        destination=NotificationDestinationRole.MEMBERS,
                        msg=msg,
                        related_object='super_hr',
                    ),
                ]
            )
    if 'timezone' in data:
        if not data['timezone']:
            raise HTTPException(422, detail='timezone can not be null')
        data['timezone'] = data['timezone'].value
    if 'availability_time' in data:
        data['availability_time_start'] = data['availability_time'].start
        data['availability_time_end'] = data['availability_time'].end
        data.pop('availability_time')
    if 'pool' in data:
        data['pool'] = (
            await resolve_db_id(m.EmployeePool, data['pool'].value, session=session)
            if data['pool']
            else None
        )
    for k, v in data.items():
        setattr(emp, k, v)
    if session.is_modified(emp):
        await session.commit()
    await notification.send()
    for notification_pp in people_project_notifications:
        await send_notification_to_people_project(
            notification_pp[0], notification_pp[1]
        )
    return make_id_output(emp.id)


@router.post('/{employee_id}/photo')
async def upload_employee_photo(
    employee_id: EmployeeIDParamT,
    file: UploadFile,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    emp = await resolve_employee_id_param(employee_id, session=session)
    curr_user = current_employee()
    if curr_user.id != employee_id:
        raise HTTPException(403, detail='forbidden')
    filepath = await upload_photo(file.filename if file.filename else 'tmp', file.file)
    emp.photo = filepath
    await session.commit()
    return make_id_output(emp.id)


@router.delete('/{employee_id}/photo')
async def delete_employee_photo(
    employee_id: EmployeeIDParamT, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    curr_user = current_employee()
    emp = await resolve_employee_id_param(employee_id, session=session)
    if curr_user.id != employee_id:
        raise HTTPException(403, detail='forbidden')
    default_photo = generate_default_photo(emp.id, emp.english_name)
    photo_path = await upload_photo(f'{emp.id}.jpg', default_photo)
    emp.photo = photo_path
    await session.commit()
    return make_id_output(emp.id)


@router.get('/select/role')
async def list_roles(query: SelectParams = Depends(SelectParams)) -> SelectOutput:
    curr_user = current_employee()
    if curr_user.is_super_admin:
        roles_ = m.ROLES
    else:
        roles_ = list(filter(lambda r: r != 'super_admin', m.ROLES))
    return make_select_output(
        items=[
            SelectField(label=r, value=r)
            for r in filter(
                lambda t: re.match(f'.*{query.search}.*', t, re.IGNORECASE), roles_
            )
        ]
    )


@router.get('/select/managers/update')
@router.get('/select/mentors/update')
async def select_subordinates_on_update(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = await get_subordinates_on_update_query(session=session)
    if query.search:
        q = q.filter(m.Employee.english_name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by('english_name').limit(10))
    return make_select_output(
        items=[SelectEmployeeField.from_obj(emp) for emp in results.all()]
    )


@router.post('/{employee_id}/watch')
async def watch_employee(
    employee_id: EmployeeIDParamT, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    curr_user = current_employee()
    emp = await resolve_employee_id_param(employee_id, session=session)
    if len(list(filter(lambda u: u.id == curr_user.id, emp.watchers))) > 0:
        raise HTTPException(422, detail='user already watched')
    emp.watchers.append(curr_user)
    if session.is_modified(emp):
        await session.commit()
    return make_id_output(emp.id)


@router.delete('/{employee_id}/watch')
async def unwatch_employee(
    employee_id: EmployeeIDParamT, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    curr_user = current_employee()
    emp = await resolve_employee_id_param(employee_id, session=session)
    filtered = list(filter(lambda u: u.id != curr_user.id, emp.watchers))
    if len(filtered) == len(emp.watchers):
        raise HTTPException(422, detail='user already unwatched')
    emp.watchers = filtered
    if session.is_modified(emp):
        await session.commit()
    return make_id_output(emp.id)


@router.get('/{employee_id}/day_status')
async def get_day_status(
    employee_id: EmployeeIDParamT,
    start: date,
    end: date,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[EmployeeDaysStatusOut]:
    emp = await resolve_employee_id_param(employee_id, session=session)
    results = await _get_employee_day_status(emp, start, end, session=session)
    return make_success_output(
        payload=EmployeeDaysStatusOut(
            employee=ShortEmployeeOut.from_obj(emp), dates=results
        )
    )


@router.put('/{employee_id}/tm_key')
async def set_tm_key(
    employee_id: EmployeeIDParamT,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[EmployeeTMKeyUpdateOut]:
    curr_user = current_employee()
    if not curr_user.is_admin and curr_user.id != employee_id:
        raise HTTPException(
            HTTPStatus.FORBIDDEN,
            detail='only admins can change the tm key for another user',
        )
    emp = await resolve_employee_id_param(employee_id, session=session)
    tm_key = secrets.token_urlsafe(16)
    if not emp.tm:
        tm_obj = m.EmployeeTM(
            employee_id=emp.id,
            last_logon=datetime.utcnow(),
            key_hash=m.EmployeeTM.hash_key(tm_key),
        )
        session.add(tm_obj)
    else:
        emp.tm.set_key(tm_key)
    await session.commit()
    return make_success_output(payload=EmployeeTMKeyUpdateOut(tm_key=tm_key))


@router.put('/{employee_id}/register')
async def register_user(
    employee_id: EmployeeIDParamT,
    session: AsyncSession = Depends(get_db_session),
) -> SuccessOutput:
    if CONFIG.AUTH_MODE != AuthModeT.LOCAL:
        raise HTTPException(
            HTTPStatus.NOT_IMPLEMENTED, detail='Registration is not allowed'
        )
    curr_user = current_employee()
    if not curr_user.is_admin or curr_user.id == employee_id:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    emp = await resolve_employee_id_param(employee_id, session=session)
    user = await session.scalar(sa.select(m.User).where(m.User.username == emp.account))
    if user:
        raise HTTPException(HTTPStatus.CONFLICT, detail='user already registered')
    register_token_data = {
        'employee_id': emp.id,
        'exp': (datetime.now() + timedelta(days=1)).timestamp(),
    }
    register_token = jwt.encode(
        register_token_data, CONFIG.JWT_SECRET, algorithm='HS256'
    )
    jinja_env = Environment(
        loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates')),
        autoescape=True,
    )
    template = jinja_env.get_template('registration_email.html.jinja2')
    task_send_email.delay(
        sender=CONFIG.SMTP_SENDER,
        recipients=[emp.email],
        subject='Workbench registration',
        body=template.render(
            public_base_url=CONFIG.PUBLIC_BASE_URL,
            employee=emp,
            register_token=register_token,
        ),
    )
    return SuccessOutput()
