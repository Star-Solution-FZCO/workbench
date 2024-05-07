from datetime import datetime

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.config import CONFIG
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    BaseOutput,
    ListFilterParams,
    SuccessPayloadOutput,
)
from wb.services.notifications import (
    Notification,
    NotificationDestinationEmployee,
    NotificationDestinationTeam,
    NotificationMessage,
)
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results, resolve_db_id
from wb.utils.notifications import send_notification_to_people_project
from wb.utils.query import make_id_output, make_list_output, make_success_output
from wb.utils.search import filter_to_query, sort_to_query

from ..schemas import RequestCreate
from .schemas import (
    JoinTeamRequestClose,
    JoinTeamRequestCloseBulk,
    JoinTeamRequestCreatePayload,
    JoinTeamRequestOut,
)

__all__ = ('router',)

router = APIRouter(prefix='/api/v1/request/join-team', tags=['v1', 'join-team-request'])


@router.get('/list')
async def list_join_team_requests(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[JoinTeamRequestOut]:
    user = current_employee()
    result_teams = await session.scalars(
        sa.select(m.Team).where(m.Team.manager_id == user.id)
    )
    current_user_teams_ids = [t.id for t in result_teams.all()]
    q = sa.select(m.JoinTeamRequest).where(
        sa.or_(
            m.JoinTeamRequest.created_by_id == user.id,
            m.JoinTeamRequest.applicant_id == user.id,
            m.JoinTeamRequest.team_id.in_(current_user_teams_ids),
        )
    )
    if query.filter:
        q = q.filter(
            filter_to_query(
                query.filter, m.JoinTeamRequest, available_fields=['status', 'subject']
            )
        )  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.JoinTeamRequest.updated,)
    if query.sort_by:
        sorts = sort_to_query(
            m.JoinTeamRequest,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['subject', 'updated', 'status'],
        )
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[JoinTeamRequestOut.from_obj(req) for req in results.all()],
    )


@router.get('/{req_id}')
async def get_join_team_request(
    req_id: int, session: AsyncSession = Depends(get_db_session)
) -> SuccessPayloadOutput[JoinTeamRequestOut]:
    req = await session.scalar(
        sa.select(m.JoinTeamRequest).where(m.JoinTeamRequest.id == req_id)
    )
    if not req:
        raise HTTPException(404, detail='request not found')
    return make_success_output(payload=JoinTeamRequestOut.from_obj(req))


@router.post('')
async def create_join_team_request(
    body: RequestCreate[JoinTeamRequestCreatePayload],
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    team = await resolve_db_id(m.Team, body.data.team.value, session=session)
    applicant = await resolve_db_id(
        m.Employee, body.data.employee.value, session=session
    )
    data = {
        'status': 'NEW',
        'applicant': applicant,
        'team': team,
        'created_by': curr_user,
        'subject': f'{body.data.employee.label} join {body.data.team.label}',
        'message': body.data.message,
    }
    try:
        obj = m.JoinTeamRequest(**data)
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    if team.manager_id == curr_user.id == applicant.id:
        await _approve_join_ream_request(obj, curr_user, session)
        await Notification(
            items=[
                NotificationMessage(
                    destination=NotificationDestinationEmployee.SELF,
                    related_object=curr_user,
                    msg=f'Your successfully joined to your team ({team.name})',
                ),
            ]
        ).send()
        return make_id_output(obj.id)
    curr_user_label = (
        f'@{curr_user.pararam}' if curr_user.pararam else curr_user.english_name
    )
    request_message_str = ''
    if body.data.message:
        request_message_str = f'msg: "{body.data.message}"\n'
    msg = (
        f'{curr_user_label} send request to you\n'
        f'{body.data.employee.label} join {body.data.team.label}\n'
        f'{request_message_str}'
        f'You can accept it [HERE]({CONFIG.PUBLIC_BASE_URL}/requests/join-team/{obj.id})\n'
        f'or by reply to this message with `yes`'
    )
    notification = Notification()
    if body.data.employee.value == curr_user.id:
        notification.items.append(
            NotificationMessage(
                destination=NotificationDestinationTeam.TEAM_LEAD,
                related_object=data['team'],
                msg=msg,
            )
        )
    else:
        notification.items.append(
            NotificationMessage(
                destination=NotificationDestinationEmployee.SELF,
                related_object=data['applicant'],
                msg=msg,
            )
        )
    await notification.send()
    return make_id_output(obj.id)


@router.put('/{request_id}/approve')
async def approve_join_team_request(
    request_id: int, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    req: 'm.JoinTeamRequest | None' = await session.scalar(
        sa.select(m.JoinTeamRequest).where(m.JoinTeamRequest.id == request_id)
    )
    if not req:
        raise HTTPException(404, detail='request not found')
    curr_user = current_employee()
    if req.status in (
        'APPROVED',
        'CLOSED',
    ):
        raise HTTPException(400, f'request already {req.status}')
    await _approve_join_ream_request(req, curr_user, session)
    return make_id_output(req.id)


@router.delete('/close')
async def bulk_close_team_request_request(
    body: JoinTeamRequestCloseBulk, session: AsyncSession = Depends(get_db_session)
) -> BaseOutput:
    results = await session.scalars(
        sa.select(m.JoinTeamRequest).where(m.JoinTeamRequest.id.in_(body.ids))
    )
    curr_user = current_employee()
    for req in results.all():
        req.updated = datetime.utcnow()
        req.status = 'CLOSED'
        req.closed_by = curr_user
        req.reason = body.reason
    await session.commit()
    return BaseOutput(success=True)


@router.delete('/{req_id}/cancel')
async def cancel_join_team_request(
    req_id: int,
    body: JoinTeamRequestClose,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    req: 'm.JoinTeamRequest | None' = await session.scalar(
        sa.select(m.JoinTeamRequest).where(m.JoinTeamRequest.id == req_id)
    )
    if not req:
        raise HTTPException(404, detail='request not found')
    if req.status == 'CLOSED':
        raise HTTPException(400, f'request already {req.status}')
    curr_user = current_employee()
    req.updated = datetime.utcnow()
    req.status = 'CLOSED'
    req.closed_by = curr_user
    req.reason = body.reason
    return make_id_output(req_id)


async def _approve_join_ream_request(
    req: m.JoinTeamRequest,
    approver: m.Employee,
    session: AsyncSession,
) -> None:
    req.updated = datetime.utcnow()
    req.approved_by = approver
    req.status = 'CLOSED'
    req.closed_by = req.approved_by
    req.applicant.team = req.team

    subj = f'Team changed for {req.applicant.english_name}'
    pararam_str = f'(@{req.applicant.pararam})' if req.applicant.pararam else ''
    txt = (
        f'<a href="{CONFIG.PUBLIC_BASE_URL}/employees/view/{req.applicant.id}">{req.applicant.english_name}</a> {pararam_str}<br>'
        f'Previous team: {req.applicant.team.name if req.applicant.team else "---"}<br>'
        f'Current team: {req.team.name if req.team else "---"}'
    )

    await session.commit()
    await send_notification_to_people_project(subj, txt)
