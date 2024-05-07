import json

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
    SelectFieldInt,
)
from wb.schemas.output import SelectOutput
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import (
    make_id_output,
    make_list_output,
    make_select_output,
    make_success_output,
)
from wb.utils.search import filter_to_query, sort_to_query

from .schemas import ServiceCreate, ServiceOut, ServiceUpdate

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/help-center/service', tags=['v1', 'service'])


@router.get('/list')
async def list_services(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[ServiceOut]:
    q = sa.select(m.Service)
    if query.filter:
        available_fields = [
            'name',
            'description',
            'portal_group_id',
            'tags',
            'is_active',
        ]
        q = q.filter(
            filter_to_query(query.filter, m.Service, available_fields=available_fields)
        )  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.Service.name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.Service,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['name'],
        )
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[ServiceOut.from_obj(obj) for obj in results.all()],
    )


@router.get('/select')
async def service_select(
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = sa.select(m.Service).where(m.Service.is_active.is_(True))
    results = await session.scalars(q.order_by('name'))
    return make_select_output(
        items=[
            SelectFieldInt.from_obj(obj, label='name', value='id')
            for obj in results.all()
        ]
    )


@router.get('/{service_id}')
async def get_service(
    service_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[ServiceOut]:
    obj: m.Service | None = await session.scalar(
        sa.select(m.Service).where(m.Service.id == service_id)
    )
    if not obj:
        raise HTTPException(404, detail='Service not found')
    return make_success_output(payload=ServiceOut.from_obj(obj))


@router.post('')
async def create_service(
    body: ServiceCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    try:
        obj = m.Service(
            name=body.name,
            description=body.description,
            short_description=body.short_description,
            portal_group_id=body.portal_group_id,
            icon=body.icon,
            user_fields=json.dumps(body.user_fields),
            predefined_custom_fields=json.dumps(body.predefined_custom_fields),
        )
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.put('/{service_id}')
async def update_service(
    service_id: int,
    body: ServiceUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    obj: m.Service | None = await session.scalar(
        sa.select(m.Service).where(m.Service.id == service_id)
    )
    if not obj:
        raise HTTPException(404, detail='Service not found')
    data: dict = body.dict(exclude_unset=True)
    if 'user_fields' in data:
        obj.user_fields = json.dumps(data['user_fields'])
        data.pop('user_fields')
    if 'predefined_custom_fields' in data:
        obj.predefined_custom_fields = json.dumps(data['predefined_custom_fields'])
        data.pop('predefined_custom_fields')
    for k, v in data.items():
        setattr(obj, k, v)
    if session.is_modified(obj):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.delete('/{service_id}')
async def delete_service(
    service_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    obj: m.Service | None = await session.scalar(
        sa.select(m.Service).where(
            m.Service.id == service_id,
        )
    )
    if not obj:
        raise HTTPException(404, detail='Service not found')
    obj.is_active = False
    await session.commit()
    return make_id_output(obj.id)
