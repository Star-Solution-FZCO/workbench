import re

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.activity_collector.connectors import create_connector
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    ListFilterParams,
    SelectField,
    SelectFieldInt,
    SelectOutput,
    SelectParams,
)
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import make_id_output, make_list_output, make_select_output
from wb.utils.search import filter_to_query

from .schemas import ActivitySourceCreate, ActivitySourceOut, ActivitySourceUpdate

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/activity', tags=['v1', 'activity'])


@router.get('/source/select')
async def list_source_select(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    results = await session.scalars(
        sa.select(m.ActivitySource)
        .where(m.ActivitySource.name.ilike(f'%{query.search}%'))
        .distinct()
    )
    return make_select_output(
        items=[
            SelectFieldInt.from_obj(s, label='name', value='id') for s in results.all()
        ]
    )


@router.get('/source/select/type')
async def list_source_type_select(
    query: SelectParams = Depends(SelectParams),
) -> SelectOutput:
    return make_select_output(
        items=[
            SelectField(label=r, value=r)
            for r in filter(
                lambda t: re.match(f'.*{query.search}.*', t, re.IGNORECASE),
                m.ActivitySourceType,
            )
        ]
    )


@router.post('/source')
async def create_activity_source(
    body: ActivitySourceCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    obj = m.ActivitySource(
        type=body.type.value,
        name=body.name,
        description=body.description,
        config=body.config,
        active=body.active,
        private=body.private,
    )
    try:
        create_connector(obj)
    except (ValueError, KeyError, TypeError) as err:
        raise HTTPException(422, detail=f'{err}') from err
    session.add(obj)
    try:
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.put('/source/{source_id}')
async def update_activity_source(
    source_id: int,
    body: ActivitySourceUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    obj: m.ActivitySource | None = await session.scalar(
        sa.select(m.ActivitySource).where(m.ActivitySource.id == source_id)
    )
    if not obj:
        raise HTTPException(404, detail='Source not found')
    data: dict = body.dict(exclude_unset=True)
    if 'type' in data:
        obj.type = body.type.value  # type: ignore[assignment, union-attr]
        data.pop('type')
    for k, v in data.items():
        setattr(obj, k, v)
    if session.is_modified(obj):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.get('/source/list')
async def list_activity_source(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[ActivitySourceOut]:
    q = sa.select(m.ActivitySource)
    if query.filter:
        flt = filter_to_query(query.filter, m.ActivitySource, available_fields=['name'])
        q = q.filter(flt)  # type: ignore
    count = await count_select_query_results(q, session=session)
    results = await session.scalars(
        q.order_by(m.ActivitySource.name).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[ActivitySourceOut.from_obj(obj) for obj in results.all()],
    )
