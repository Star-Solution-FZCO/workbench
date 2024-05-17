from datetime import datetime
from typing import Any

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    BasePayloadOutput,
    ListFilterParams,
)
from wb.services.notifications import create_inner_notifications
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import make_id_output, make_list_output, make_success_output
from wb.utils.search import filter_to_query, sort_to_query

from .schemas import (
    NotificationCreate,
    NotificationOut,
    NotificationUpdate,
    ReadNotifications,
)

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/notifications', tags=['v1', 'notification'])


async def query_notifications(
    orm_query: Any, query: ListFilterParams, session: AsyncSession
):
    curr_user = current_employee()
    available_fields = ['subject', 'type', 'read', 'show_on_main_page']
    if curr_user.is_admin:
        available_fields += ['recipient_id']
    q = orm_query
    if query.filter:
        q = q.filter(
            filter_to_query(
                query.filter, m.Notification, available_fields=available_fields
            )
        )  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.Notification.created.desc(),)
    if query.sort_by:
        sorts = sort_to_query(
            m.Notification,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['subject', 'created'],
        )
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[NotificationOut.from_obj(obj) for obj in results.all()],
    )


@router.get('/list/my')
async def list_employee_notifications(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[NotificationOut]:
    curr_user = current_employee()
    orm_query = sa.select(m.Notification).where(
        m.Notification.recipient_id == curr_user.id
    )
    output = await query_notifications(
        orm_query=orm_query, query=query, session=session
    )
    return output


@router.get('/list')
async def list_notifications(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[NotificationOut]:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    output = await query_notifications(
        orm_query=sa.select(m.Notification), query=query, session=session
    )
    return output


@router.get('/{notification_id}')
async def get_notification(
    notification_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[NotificationOut]:
    curr_user = current_employee()
    obj: m.Notification | None = await session.scalar(
        sa.select(m.Notification).where(m.Notification.id == notification_id)
    )
    if not obj:
        raise HTTPException(404, detail='Notification not found')
    if obj.recipient_id != curr_user.id and not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    return make_success_output(payload=NotificationOut.from_obj(obj))


@router.post('')
async def create_notifications(
    body: NotificationCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    await create_inner_notifications(
        session=session,
        recipients=body.recipients,
        subject=body.subject,
        content=body.content,
        notification_type=body.type,
        show_on_main_page=body.show_on_main_page,
    )
    return make_success_output(payload='Success')


@router.put('/{notification_id}')
async def update_notification(
    notification_id: int,
    body: NotificationUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    obj: m.Notification | None = await session.scalar(
        sa.select(m.Notification).where(m.Notification.id == notification_id)
    )
    if not obj:
        raise HTTPException(404, detail='Notification not found')
    if obj.recipient_id != curr_user.id and not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    data = body.dict(exclude_unset=True)
    if data.get('read') is True:
        obj.read = datetime.utcnow()
        data.pop('read')
    for k, v in data.items():
        setattr(obj, k, v)
    if session.is_modified(obj):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(409, detail='Duplicate') from err
    return make_id_output(obj.id)


@router.post('/read')
async def mark_notifications_as_read(
    body: ReadNotifications,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    notification_ids = body.notifications
    notifications: m.Notification | None = await session.scalars(
        sa.select(m.Notification).where(
            sa.and_(
                m.Notification.id.in_(notification_ids),
                m.Notification.recipient_id == curr_user.id,
            )
        )
    )
    for notification in notifications.all():
        notification.read = datetime.utcnow()
    await session.commit()
    return make_success_output(payload='Success')


@router.delete('/{notification_id}')
async def delete_notification(
    notification_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    obj: m.Notification | None = await session.scalar(
        sa.select(m.Notification).where(m.Notification.id == notification_id)
    )
    if not obj:
        raise HTTPException(404, detail='Notification not found')
    if obj.recipient_id != curr_user.id and not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    await session.delete(obj)
    await session.commit()
    return make_id_output(obj.id)
