# pylint: disable=too-many-lines
import hashlib
import random
from datetime import date, datetime, timedelta
from http import HTTPStatus
from typing import Callable, Dict, List, Optional

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from shared_utils.dateutils import date_range, format_date
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    BasePayloadOutput,
    ListFilterParams,
    ShortEmployeeOut,
)
from wb.services import (
    calc_employee_vacation_days,
    get_employee_scheduled_holidays_and_weekends,
)
from wb.services.notifications import (
    Notification,
    NotificationDestinationEmployee,
    NotificationDestinationRole,
    NotificationMessage,
)
from wb.utils.current_user import current_employee, get_current_roles_employee_related
from wb.utils.db import count_select_query_results, resolve_db_ids
from wb.utils.query import (
    get_select_value,
    make_id_output,
    make_list_output,
    make_success_output,
)
from wb.utils.schedule import humanize_day_type
from wb.utils.search import filter_to_query

from ..utils import EmployeeIDParamT, resolve_employee_id_param
from .schemas import (
    EmployeeFreeVacationDays,
    EmployeeScheduleExclusionCreate,
    EmployeeScheduleExclusionGroupedOut,
    EmployeeScheduleExclusionOut,
    EmployeeScheduleMoveExclusion,
    EmployeeScheduleMoveExclusionOut,
    EmployeeScheduleOut,
    EmployeeScheduleUpdate,
    EmployeeVacationCorrectionCreate,
    EmployeeVacationCorrectionOut,
)

__all__ = ('router',)


router = APIRouter(
    prefix='/api/v1/employee/{employee_id}/schedule', tags=['v1', 'employee']
)


async def gen_new_exclusion_guid(
    emp: m.Employee, gen_guid: Callable[[m.Employee], str], session: AsyncSession
) -> str:
    guid = gen_guid(emp)
    while await session.scalar(
        sa.select(sa.func.count())  # pylint: disable=not-callable
        .select_from(m.EmployeeScheduleExclusion)
        .filter(
            m.EmployeeScheduleExclusion.employee_id == emp.id,
            m.EmployeeScheduleExclusion.guid == guid,
        )
    ):
        guid = gen_guid(emp)
    return guid


@router.get('')
async def get_employee_schedule(
    employee_id: EmployeeIDParamT,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[Optional[EmployeeScheduleOut]]:
    emp = await resolve_employee_id_param(employee_id, session=session)
    today = date.today()
    schedule: Optional['m.EmployeeSchedule'] = await session.scalar(
        sa.select(m.EmployeeSchedule).where(
            m.EmployeeSchedule.employee_id == emp.id,
            m.EmployeeSchedule.start <= today,
            sa.or_(m.EmployeeSchedule.end.is_(None), m.EmployeeSchedule.end >= today),
        )
    )
    if not schedule:
        return make_success_output(payload=None)
    curr_user = current_employee()
    return make_success_output(
        payload=EmployeeScheduleOut.from_obj(schedule, can_remove=curr_user.is_super_hr)
    )


@router.get('/list')
async def get_employee_schedule_list(
    employee_id: EmployeeIDParamT,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[EmployeeScheduleOut]:
    emp = await resolve_employee_id_param(employee_id, session=session)
    flt = m.EmployeeSchedule.employee_id == emp.id
    count_result = await session.execute(
        sa.select(sa.func.count())  # pylint: disable=not-callable
        .select_from(m.EmployeeSchedule)
        .filter(flt)
    )
    if (count := count_result.scalar()) is None:
        count = 0
    results = await session.scalars(
        sa.select(m.EmployeeSchedule)
        .filter(flt)
        .order_by(m.EmployeeSchedule.start.desc())
        .limit(query.limit)
        .offset(query.offset)
    )
    curr_user = current_employee()
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[
            EmployeeScheduleOut.from_obj(res, can_remove=curr_user.is_super_hr)
            for res in results.all()
        ],
    )


@router.delete('/{start}')
async def remove_employee_schedule(
    employee_id: EmployeeIDParamT,
    start: date,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_super_hr:
        raise HTTPException(403, detail='forbidden')
    emp = await resolve_employee_id_param(employee_id, session=session)
    obj = await session.scalar(
        sa.select(m.EmployeeSchedule).where(
            m.EmployeeSchedule.employee_id == emp.id,
            m.EmployeeSchedule.start == start,
        )
    )
    if not obj:
        raise HTTPException(404, detail='schedule not found')
    await session.delete(obj)
    await session.commit()
    return make_id_output(emp.id)


@router.put('')
async def update_employee_schedule(
    employee_id: EmployeeIDParamT,
    body: EmployeeScheduleUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_hr:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='denied')
    emp = await resolve_employee_id_param(employee_id, session=session)
    if body.end and body.start > body.end:
        raise HTTPException(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            detail='start of the schedule should be earlier than the end',
        )
    q_validate = sa.select(m.EmployeeSchedule).where(
        m.EmployeeSchedule.employee_id == employee_id
    )
    if body.end:
        q_validate = q_validate.filter(
            sa.or_(
                m.EmployeeSchedule.start.between(body.start, body.end),
                sa.and_(
                    m.EmployeeSchedule.end.isnot(None),
                    m.EmployeeSchedule.end.between(body.start, body.end),
                ),
                sa.and_(
                    m.EmployeeSchedule.start <= body.start,
                    sa.or_(
                        m.EmployeeSchedule.end.is_(None),
                        m.EmployeeSchedule.end >= body.start,
                    ),
                ),
            )
        )
    else:
        q_validate = q_validate.filter(
            sa.or_(
                m.EmployeeSchedule.start >= body.start,
                sa.and_(
                    m.EmployeeSchedule.end.isnot(None),
                    m.EmployeeSchedule.end >= body.start,
                ),
            )
        )
    count_validate = await count_select_query_results(q_validate, session=session)
    if count_validate:
        raise HTTPException(
            HTTPStatus.CONFLICT, detail='intersect with another schedule'
        )
    if not body.end:
        last_schedule = await session.scalar(
            sa.select(m.EmployeeSchedule).where(
                m.EmployeeSchedule.employee_id == emp.id,
                m.EmployeeSchedule.end.is_(None),
            )
        )
        if last_schedule:
            last_schedule.end = body.start - timedelta(days=1)
    new_schedule = m.EmployeeSchedule(
        employee_id=emp.id,
        holiday_set_id=get_select_value(body.holiday_set),
        dow=body.dow.to_bits(),
        start=body.start,
        end=body.end,
        vacation_days_per_year=body.vacation_days_per_year,
        individual_working_hours=body.individual_working_hours,
    )
    msg = f'Schedule for {emp.link_pararam} has been changed from {format_date(body.start)} by {curr_user.link_pararam}'
    msg_self = (
        f'Your schedule has been changed from {format_date(body.start)} by {curr_user}'
    )
    notification = Notification(
        items=[
            NotificationMessage(
                destination=NotificationDestinationEmployee.SELF,
                related_object=emp,
                msg=msg_self,
            ),
            NotificationMessage(
                destination=NotificationDestinationEmployee.MANAGERS,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='hr',
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='super_hr',
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='finance',
                msg=msg,
            ),
        ]
    )
    session.add(new_schedule)
    await session.commit()
    await notification.send()
    return make_id_output(emp.id)


@router.get('/exclusion/list')
async def get_exclusions(
    employee_id: EmployeeIDParamT,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[EmployeeScheduleExclusionOut]:
    emp = await resolve_employee_id_param(employee_id, session=session)
    q = sa.select(
        m.EmployeeScheduleExclusion,
    ).filter(
        m.EmployeeScheduleExclusion.employee_id == emp.id,
    )
    if query.filter:
        flt = filter_to_query(
            query.filter,
            m.EmployeeScheduleExclusion,
            available_fields=['type', 'day', 'canceled'],
        )
        q = q.filter(flt)  # type: ignore
    count = await count_select_query_results(q, session=session)
    results = await session.scalars(
        q.order_by(sa.desc(m.EmployeeScheduleExclusion.day))
        .limit(query.limit)
        .offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[EmployeeScheduleExclusionOut.from_obj(res) for res in results.all()],
    )


@router.get('/exclusion/list/grouped')
async def get_exclusions_grouped(
    employee_id: EmployeeIDParamT,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[EmployeeScheduleExclusionGroupedOut]:
    emp = await resolve_employee_id_param(employee_id, session=session)
    q = (
        sa.select(
            m.EmployeeScheduleExclusion.guid,
            m.EmployeeScheduleExclusion.type,
            m.EmployeeScheduleExclusion.canceled,
            m.EmployeeScheduleExclusion.canceled_by_id,
            sa.func.min(  # pylint: disable=not-callable
                m.EmployeeScheduleExclusion.day
            ).label('start_date'),
            sa.func.max(  # pylint: disable=not-callable
                m.EmployeeScheduleExclusion.day
            ).label('end_date'),
            sa.func.count().label('days'),  # pylint: disable=not-callable
        )
        .where(
            m.EmployeeScheduleExclusion.type.in_(
                (
                    m.DayType.SICK_DAY,
                    m.DayType.VACATION,
                    m.DayType.UNPAID_LEAVE,
                    m.DayType.BUSINESS_TRIP,
                )
            ),
        )
        .group_by(
            m.EmployeeScheduleExclusion.guid,
            m.EmployeeScheduleExclusion.type,
            m.EmployeeScheduleExclusion.canceled,
            m.EmployeeScheduleExclusion.canceled_by_id,
        )
        .filter(
            m.EmployeeScheduleExclusion.employee_id == emp.id,
        )
    )
    if query.filter:
        flt = filter_to_query(
            query.filter,
            m.EmployeeScheduleExclusion,
            available_fields=['type', 'canceled'],
        )
        q = q.filter(flt)  # type: ignore
    count = await count_select_query_results(q, session=session)
    results_raw = await session.execute(
        q.order_by(sa.desc('start_date')).limit(query.limit).offset(query.offset)
    )
    results = results_raw.all()
    cancelers: Dict[int, m.Employee] = {
        e.id: e
        for e in await resolve_db_ids(
            m.Employee,
            filter(lambda i: i, [res.canceled_by_id for res in results]),
            session=session,
        )  # type: ignore
    }
    curr_roles = get_current_roles_employee_related(emp)
    can_cancel = bool(
        {
            'super_hr',
            'hr',
            'manager',
            'team_lead',
            'self',
        }.intersection(curr_roles)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[
            EmployeeScheduleExclusionGroupedOut(
                guid=res.guid,
                type=res.type,
                start=res.start_date,
                days=res.days,
                end=res.end_date,
                canceled=res.canceled,
                canceled_by=(
                    ShortEmployeeOut.from_obj(cancelers[res.canceled_by_id])
                    if res.canceled_by_id
                    else None
                ),
                can_cancel=not bool(res.canceled) and can_cancel,
            )
            for res in results
        ],
    )


@router.post('/exclusion')
async def create_schedule_exclusion(
    employee_id: EmployeeIDParamT,
    body: EmployeeScheduleExclusionCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    # pylint: disable=too-many-locals
    def gen_guid(emp: m.Employee) -> str:
        return hashlib.sha1(
            f'{datetime.utcnow()}-{str(body.type)}-{body.start}-{body.end}-{emp.id}-{random.random()}'.encode(),  # nosec random
            usedforsecurity=False,
        ).hexdigest()

    emp = await resolve_employee_id_param(employee_id, session=session)
    curr_roles = get_current_roles_employee_related(emp)
    is_manager = {'manager', 'team_lead'}.intersection(curr_roles)
    is_hr = {'hr', 'super_hr'}.intersection(curr_roles)
    is_super_hr = {'super_hr'}.intersection(curr_roles)
    is_self = {'self'}.intersection(curr_roles)
    if body.type == m.DayType.UNPAID_LEAVE and not is_super_hr:
        raise HTTPException(403, detail='permission denied')
    if not is_self and not is_manager and not is_hr:
        raise HTTPException(
            403, detail='you can not set schedule exception for this user'
        )
    if body.type not in (
        m.DayType.VACATION,
        m.DayType.UNPAID_LEAVE,
        m.DayType.SICK_DAY,
        m.DayType.BUSINESS_TRIP,
    ):
        raise HTTPException(422, detail='wrong exclusion type')
    if body.start > body.end:
        raise HTTPException(422, detail='start date must be earlier than end date')
    not_manager_and_hr = not is_manager and not is_hr
    if (
        not_manager_and_hr
        and body.type == m.DayType.SICK_DAY
        and body.start < date.today() - timedelta(days=3)
    ):
        raise HTTPException(
            422,
            detail="you can't set the sick day earlier than 3 days ago, contact hr.",
        )
    if (
        not_manager_and_hr
        and body.type != m.DayType.SICK_DAY
        and body.start < date.today()
    ):
        raise HTTPException(422, detail="can't be set earlier today, contact hr")
    guid = await gen_new_exclusion_guid(emp, gen_guid, session=session)
    curr_user = current_employee()
    msg = (
        f'Schedule exclusion from {format_date(body.start)} to {format_date(body.end)} ({humanize_day_type(body.type)}) '
        f'for {emp.link_pararam} has been added by {curr_user.link_pararam}'
    )
    notification = Notification(
        items=[
            NotificationMessage(
                destination=NotificationDestinationEmployee.SELF,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationEmployee.MANAGERS,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationEmployee.TEAM_LEAD,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='hr',
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='super_hr',
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='finance',
                msg=msg,
            ),
        ]
    )
    holidays, weekends = await get_employee_scheduled_holidays_and_weekends(
        emp, body.start, body.end, session=session
    )
    holidays_and_weekends = holidays.union(weekends)
    is_something_added = False
    for day in date_range(body.start, body.end):
        if (
            body.type
            in (m.DayType.VACATION, m.DayType.SICK_DAY, m.DayType.UNPAID_LEAVE)
            and day in holidays_and_weekends
        ):
            continue
        obj = m.EmployeeScheduleExclusion(
            day=day,
            type=body.type,
            guid=guid,
            employee_id=emp.id,
            created_by_id=curr_user.id,
        )
        is_something_added = True
        session.add(obj)
    if not is_something_added:
        raise HTTPException(422, detail='empty schedule exclusion')
    try:
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(
            409, detail='range intersect with another exclusion'
        ) from err
    await notification.send()
    return make_id_output(emp.id)


@router.post('/move')
async def create_move_exclusion(
    employee_id: EmployeeIDParamT,
    body: EmployeeScheduleMoveExclusion,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    # pylint: disable=too-many-locals
    def gen_guid(emp: m.Employee) -> str:
        return hashlib.sha1(
            f'{datetime.utcnow()}-move-{body.weekend}-{body.working_day}-{emp.id}-{random.random()}'.encode(),  # nosec random
            usedforsecurity=False,
        ).hexdigest()

    emp = await resolve_employee_id_param(employee_id, session=session)
    curr_roles = get_current_roles_employee_related(emp)
    is_hr = {'super_hr', 'hr'}.intersection(curr_roles)
    is_manager = {'manager', 'team_lead'}.intersection(curr_roles)
    is_self = {'self'}.intersection(curr_roles)
    if not is_self and not is_manager and not is_hr:
        raise HTTPException(
            403, detail='you can not set schedule exception for this user'
        )
    if not body.weekend and not body.working_day:
        raise HTTPException(422, detail='you need to choose dates')
    if not is_hr and not (body.weekend and body.working_day):
        raise HTTPException(422, detail='you need to choose both dates')
    if not (is_manager or is_hr) and (
        body.working_day
        and body.working_day < date.today()
        or body.weekend
        and body.weekend < date.today()
    ):
        raise HTTPException(422, detail='all dates must be at least today')
    guid = await gen_new_exclusion_guid(emp, gen_guid, session=session)
    curr_user = current_employee()
    days: List[date] = list(filter(lambda x: x, [body.weekend, body.working_day]))  # type: ignore
    holidays, weekends = await get_employee_scheduled_holidays_and_weekends(
        emp, min(days), max(days), session=session
    )
    holidays_and_weekends = holidays.union(weekends)
    if body.weekend and body.weekend in holidays_and_weekends:
        raise HTTPException(422, f'{body.weekend} already a weekend')
    if body.working_day and body.working_day not in holidays_and_weekends:
        raise HTTPException(422, f'{body.working_day} already a working day')
    msg = (
        f'Schedule has been changed for {emp.link_pararam} by {curr_user.link_pararam}:'
    )
    if body.working_day:
        obj_working_day = m.EmployeeScheduleExclusion(
            day=body.working_day,
            type=m.DayType.WORKING_DAY_PERSONAL,
            guid=guid,
            employee_id=emp.id,
            created_by_id=curr_user.id,
        )
        session.add(obj_working_day)
        msg += f'\n{format_date(body.working_day)} is working day now'
    if body.weekend:
        obj_weekend = m.EmployeeScheduleExclusion(
            day=body.weekend,
            type=m.DayType.WEEKEND_PERSONAL,
            guid=guid,
            employee_id=emp.id,
            created_by_id=curr_user.id,
        )
        session.add(obj_weekend)
        msg += f'\n{format_date(body.weekend)} is weekend now'
    notification = Notification(
        items=[
            NotificationMessage(
                destination=NotificationDestinationEmployee.SELF,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationEmployee.MANAGERS,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationEmployee.TEAM_LEAD,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='hr',
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='super_hr',
                msg=msg,
            ),
        ]
    )
    try:
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(
            409, detail='range intersect with another exclusion'
        ) from err
    await notification.send()
    return make_id_output(emp.id)


@router.put('/move/{guid}')
async def update_move_exclusion(
    employee_id: EmployeeIDParamT,
    guid: str,
    body: EmployeeScheduleMoveExclusion,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    # pylint: disable=too-many-locals,too-many-branches,too-many-statements
    emp = await resolve_employee_id_param(employee_id, session=session)
    curr_roles = get_current_roles_employee_related(emp)
    is_hr = {'super_hr', 'hr'}.intersection(curr_roles)
    is_manager = {'manager', 'team_lead'}.intersection(curr_roles)
    is_self = {'self'}.intersection(curr_roles)
    if not is_self and not is_manager and not is_hr:
        raise HTTPException(
            403, detail='you can not set schedule exception for this user'
        )
    if not body.weekend and not body.working_day:
        raise HTTPException(422, detail='you need to choose dates')
    if not is_hr and not (body.weekend and body.working_day):
        raise HTTPException(422, detail='you need to choose both dates')
    if not (is_manager or is_hr) and (
        body.working_day
        and body.working_day < date.today()
        or body.weekend
        and body.weekend < date.today()
    ):
        raise HTTPException(422, detail='all dates must be at least today')
    curr_user = current_employee()
    days: List[date] = list(filter(lambda x: x, [body.weekend, body.working_day]))  # type: ignore
    holidays, weekends = await get_employee_scheduled_holidays_and_weekends(
        emp, min(days), max(days), session=session
    )
    holidays_and_weekends = holidays.union(weekends)
    if body.weekend and body.weekend in holidays_and_weekends:
        raise HTTPException(422, f'{body.weekend} already a weekend')
    if body.working_day and body.working_day not in holidays_and_weekends:
        raise HTTPException(422, f'{body.working_day} already a working day')
    msg = (
        f'Schedule has been changed for {emp.link_pararam} by {curr_user.link_pararam}:'
    )
    obj_working_day: m.EmployeeScheduleExclusion | None = await session.scalar(
        sa.select(m.EmployeeScheduleExclusion).where(
            sa.and_(
                m.EmployeeScheduleExclusion.guid == guid,
                m.EmployeeScheduleExclusion.type == m.DayType.WORKING_DAY_PERSONAL,
            )
        )
    )
    obj_weekend: m.EmployeeScheduleExclusion | None = await session.scalar(
        sa.select(m.EmployeeScheduleExclusion).where(
            sa.and_(
                m.EmployeeScheduleExclusion.guid == guid,
                m.EmployeeScheduleExclusion.type == m.DayType.WEEKEND_PERSONAL,
            )
        )
    )
    if obj_working_day:
        if body.working_day is not None:
            obj_working_day.day = body.working_day
            msg += f'\n{format_date(body.working_day)} is working day now'
        else:
            await session.delete(obj_working_day)
    elif body.working_day:
        obj_working_day = m.EmployeeScheduleExclusion(
            day=body.working_day,
            type=m.DayType.WORKING_DAY_PERSONAL,
            guid=guid,
            employee_id=emp.id,
            created_by_id=curr_user.id,
        )
        session.add(obj_working_day)
        msg += f'\n{format_date(body.working_day)} is working day now'
    if obj_weekend:
        if body.weekend is not None:
            obj_weekend.day = body.weekend
            msg += f'\n{format_date(body.weekend)} is weekend now'
        else:
            await session.delete(obj_weekend)
    elif body.weekend:
        obj_weekend = m.EmployeeScheduleExclusion(
            day=body.weekend,
            type=m.DayType.WEEKEND_PERSONAL,
            guid=guid,
            employee_id=emp.id,
            created_by_id=curr_user.id,
        )
        session.add(obj_weekend)
        msg += f'\n{format_date(body.weekend)} is weekend now'
    notification = Notification(
        items=[
            NotificationMessage(
                destination=NotificationDestinationEmployee.SELF,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationEmployee.MANAGERS,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationEmployee.TEAM_LEAD,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='hr',
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='super_hr',
                msg=msg,
            ),
        ]
    )
    try:
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    await notification.send()
    return make_id_output(employee_id)


@router.get('/move/list')
async def list_schedule_move(
    employee_id: EmployeeIDParamT,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[EmployeeScheduleMoveExclusionOut]:
    emp = await resolve_employee_id_param(employee_id, session=session)
    curr_user = current_employee()
    flt = m.EmployeeScheduleExclusion.employee_id == emp.id
    q = (
        sa.select(
            m.EmployeeScheduleExclusion.guid.distinct(),
            sa.func.min(  # pylint: disable=not-callable
                m.EmployeeScheduleExclusion.day
            ).label('min_day'),
        )
        .where(
            m.EmployeeScheduleExclusion.type.in_(
                (
                    m.DayType.WORKING_DAY_PERSONAL,
                    m.DayType.WEEKEND_PERSONAL,
                )
            )
        )
        .group_by(m.EmployeeScheduleExclusion.guid)
        .filter(flt)
        .order_by('min_day')
    )
    count = await count_select_query_results(q, session=session)
    guids_raw = await session.scalars(q.limit(query.limit).offset(query.offset))
    guids = guids_raw.all()
    results_raw = await session.scalars(
        sa.select(m.EmployeeScheduleExclusion)
        .where(m.EmployeeScheduleExclusion.guid.in_(guids))
        .order_by(m.EmployeeScheduleExclusion.day)
        .filter(flt)
    )
    results: Dict[str, Dict[m.DayType, m.EmployeeScheduleExclusion]] = {}
    for res in results_raw.all():
        if res.guid not in results:
            results[res.guid] = {}
        results[res.guid][res.type] = res  # type: ignore
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[
            EmployeeScheduleMoveExclusionOut(
                guid=guid,
                weekend=(
                    res[m.DayType.WEEKEND_PERSONAL].day
                    if m.DayType.WEEKEND_PERSONAL in res
                    else None
                ),
                working_day=(
                    res[m.DayType.WORKING_DAY_PERSONAL].day
                    if m.DayType.WORKING_DAY_PERSONAL in res
                    else None
                ),
                can_cancel=bool(curr_user.is_hr and not list(res.values())[0].canceled),
                canceled=list(res.values())[0].canceled,
            )
            for guid, res in results.items()
        ],
    )


@router.delete('/exclusion/cancel/{day}')
async def cancel_one_day_in_schedule_exclusion(
    employee_id: EmployeeIDParamT,
    day: date,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    # pylint: disable=too-many-locals
    emp = await resolve_employee_id_param(employee_id, session=session)
    curr_roles = get_current_roles_employee_related(emp)
    is_hr = {
        'super_hr',
        'hr',
    }.intersection(curr_roles)
    is_manager = {
        'manager',
        'team_lead',
    }.intersection(curr_roles)
    is_self = {'self'}.intersection(curr_roles)
    if not is_hr and not is_self and not is_manager:
        raise HTTPException(
            403, detail='you can not cancel schedule exclusions for this user'
        )
    if not is_hr and day + timedelta(days=14) < date.today():
        raise HTTPException(
            403, detail='you can not cancel schedule exclusion more than 14 days ago'
        )
    exclusion: m.EmployeeScheduleExclusion | None = await session.scalar(
        sa.select(m.EmployeeScheduleExclusion).where(
            m.EmployeeScheduleExclusion.employee_id == emp.id,
            m.EmployeeScheduleExclusion.day == day,
            m.EmployeeScheduleExclusion.canceled.is_(None),
        )
    )
    if not exclusion:
        raise HTTPException(404, 'exclusion not found')
    if not is_hr and exclusion.type not in (
        m.DayType.SICK_DAY,
        m.DayType.VACATION,
        m.DayType.BUSINESS_TRIP,
    ):
        raise HTTPException(
            403, detail='you can not cancel this type of schedule exclusion'
        )
    cnt = await count_select_query_results(
        sa.select(m.EmployeeScheduleExclusion).where(
            m.EmployeeScheduleExclusion.guid == exclusion.guid
        ),
        session=session,
    )
    curr_user = current_employee()
    now = datetime.utcnow()
    if cnt > 1:

        def gen_guid(emp: m.Employee) -> str:
            return hashlib.sha1(
                f'{datetime.utcnow()}-{str(exclusion.type)}-{day}-{day}-{emp.id}-{random.random()}'.encode(),  # nosec random
                usedforsecurity=False,
            ).hexdigest()

        guid = await gen_new_exclusion_guid(emp, gen_guid, session=session)
        exclusion.guid = guid
    exclusion.canceled = now
    exclusion.canceled_by_id = curr_user.id
    notification = Notification()
    msg_self = (
        f'Your schedule exclusion at '
        f'{format_date(day)} ({humanize_day_type(exclusion.type)}) canceled by {curr_user.link_pararam}'
    )
    msg = (
        f'Schedule exclusion at '
        f'{format_date(day)} ({humanize_day_type(exclusion.type)}) for {emp.link_pararam} '
        f'has been canceled by {curr_user.link_pararam}'
    )
    notification.items.extend(
        [
            NotificationMessage(
                destination=NotificationDestinationEmployee.SELF,
                related_object=emp,
                msg=msg_self,
            ),
            NotificationMessage(
                destination=NotificationDestinationEmployee.MANAGERS,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationEmployee.TEAM_LEAD,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='hr',
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='super_hr',
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='finance',
                msg=msg,
            ),
        ]
    )
    await session.commit()
    await notification.send()
    return make_id_output(emp.id)


@router.delete('/exclusion/{guid}/cancel')
async def cancel_schedule_exclusion(
    employee_id: EmployeeIDParamT,
    guid: str,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    # pylint: disable=too-many-locals
    emp = await resolve_employee_id_param(employee_id, session=session)
    curr_roles = get_current_roles_employee_related(emp)
    is_hr = {
        'super_hr',
        'hr',
    }.intersection(curr_roles)
    is_manager = {
        'manager',
        'team_lead',
    }.intersection(curr_roles)
    is_self = {'self'}.intersection(curr_roles)
    if not is_manager and not is_hr and not is_self:
        raise HTTPException(
            403, detail='you can not cancel schedule exclusions for this user'
        )
    exclusions_raw = await session.scalars(
        sa.select(m.EmployeeScheduleExclusion).where(
            m.EmployeeScheduleExclusion.guid == guid
        )
    )
    curr_user = current_employee()
    now = datetime.utcnow()
    exclusion_start, exclusion_end, exclusion_type = None, None, None
    for excl in exclusions_raw.all():
        if excl.canceled:
            raise HTTPException(422, detail='exclusion already canceled')
        excl.canceled = now
        excl.canceled_by_id = curr_user.id
        if not exclusion_start or exclusion_start > excl.day:
            exclusion_start = excl.day
        if not exclusion_end or exclusion_end < excl.day:
            exclusion_end = excl.day
        exclusion_type = excl.type
    notification = Notification()
    if exclusion_type and exclusion_start and exclusion_end:
        msg_self = (
            f'Your schedule exclusion from '
            f'{format_date(exclusion_start)} to {format_date(exclusion_end)} ({humanize_day_type(exclusion_type)}) canceled by {curr_user.link_pararam}'
        )
        msg = (
            f'Schedule exclusion from '
            f'{format_date(exclusion_start)} to {format_date(exclusion_end)} ({humanize_day_type(exclusion_type)}) for {emp.link_pararam} '
            f'has been canceled by {curr_user.link_pararam}'
        )
        notification.items.extend(
            [
                NotificationMessage(
                    destination=NotificationDestinationEmployee.SELF,
                    related_object=emp,
                    msg=msg_self,
                ),
                NotificationMessage(
                    destination=NotificationDestinationEmployee.MANAGERS,
                    related_object=emp,
                    msg=msg,
                ),
                NotificationMessage(
                    destination=NotificationDestinationEmployee.TEAM_LEAD,
                    related_object=emp,
                    msg=msg,
                ),
                NotificationMessage(
                    destination=NotificationDestinationRole.MEMBERS,
                    related_object='hr',
                    msg=msg,
                ),
                NotificationMessage(
                    destination=NotificationDestinationRole.MEMBERS,
                    related_object='super_hr',
                    msg=msg,
                ),
                NotificationMessage(
                    destination=NotificationDestinationRole.MEMBERS,
                    related_object='finance',
                    msg=msg,
                ),
            ]
        )
    await session.commit()
    await notification.send()
    return make_id_output(emp.id)


@router.post('/vacation_correction')
async def add_vacation_correction(
    employee_id: EmployeeIDParamT,
    body: EmployeeVacationCorrectionCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_hr and 'finance' not in curr_user.roles:
        raise HTTPException(403, detail='only hr can correct vacations days')
    emp = await resolve_employee_id_param(employee_id, session=session)
    obj = m.EmployeeVacationCorrection(
        employee_id=emp.id,
        days=body.days,
        created_by_id=curr_user.id,
        description=body.description,
    )
    session.add(obj)
    msg_self = (
        f'Your vacations days have been corrected for {body.days} days '
        f'by {curr_user.link_pararam}'
    )
    msg = (
        f'Vacations days for {emp.link_pararam} have been corrected for {body.days} days '
        f'by {curr_user.link_pararam}'
    )
    notification = Notification(
        items=[
            NotificationMessage(
                destination=NotificationDestinationEmployee.SELF,
                related_object=emp,
                msg=msg_self,
            ),
            NotificationMessage(
                destination=NotificationDestinationEmployee.MANAGERS,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='hr',
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='super_hr',
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='finance',
                msg=msg,
            ),
        ]
    )
    await session.commit()
    await notification.send()
    return make_id_output(obj.id)


@router.get('/vacation_correction/list')
async def list_vacation_correction(
    employee_id: EmployeeIDParamT,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[EmployeeVacationCorrectionOut]:
    curr_user = current_employee()
    emp = await resolve_employee_id_param(employee_id, session=session)
    count_result = await session.execute(
        sa.select(sa.func.count())  # pylint: disable=not-callable
        .select_from(m.EmployeeVacationCorrection)
        .filter(m.EmployeeVacationCorrection.employee_id == emp.id)
    )
    if (count := count_result.scalar()) is None:
        count = 0
    results = await session.scalars(
        sa.select(m.EmployeeVacationCorrection)
        .filter(m.EmployeeVacationCorrection.employee_id == emp.id)
        .order_by(m.EmployeeVacationCorrection.created)
        .limit(query.limit)
        .offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[
            EmployeeVacationCorrectionOut.from_obj(obj, can_delete=curr_user.is_hr)
            for obj in results.all()
        ],
    )


@router.delete('/vacation_correction/{correction_id}')
async def delete_vacation_correction(
    employee_id: EmployeeIDParamT,
    correction_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_hr:
        raise HTTPException(403, detail='only hr can correct vacations days')
    emp = await resolve_employee_id_param(employee_id, session=session)
    obj: Optional['m.EmployeeVacationCorrection'] = await session.scalar(
        sa.select(m.EmployeeVacationCorrection).where(
            m.EmployeeVacationCorrection.id == correction_id
        )
    )
    if not obj:
        raise HTTPException(404, detail='correction not found')
    msg_self = (
        f'Your vacation days correction ({obj.days} days) has been deleted '
        f'by {curr_user.link_pararam}'
    )
    msg = (
        f'Vacation days correction({obj.days} days) for {emp.link_pararam} has been deleted '
        f'by {curr_user.link_pararam}'
    )
    notification = Notification(
        items=[
            NotificationMessage(
                destination=NotificationDestinationEmployee.SELF,
                related_object=emp,
                msg=msg_self,
            ),
            NotificationMessage(
                destination=NotificationDestinationEmployee.MANAGERS,
                related_object=emp,
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='hr',
                msg=msg,
            ),
            NotificationMessage(
                destination=NotificationDestinationRole.MEMBERS,
                related_object='finance',
                msg=msg,
            ),
        ]
    )
    await session.delete(obj)
    await notification.send()
    await session.commit()
    return make_id_output(correction_id)


@router.get('/free_vacation_days')
async def get_free_vacation_days(
    employee_id: EmployeeIDParamT,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[EmployeeFreeVacationDays]:
    emp = await resolve_employee_id_param(employee_id, session=session)
    res = await calc_employee_vacation_days(emp, session=session)
    return make_success_output(
        payload=EmployeeFreeVacationDays(
            free_vacation_days_current=res.free_vacation_days_current,
            free_vacation_days_year_end=res.free_vacation_days_year_end,
        )
    )
