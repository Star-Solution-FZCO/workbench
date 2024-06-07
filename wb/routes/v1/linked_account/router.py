import re
from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.linked_accounts_collector.connectors import (
    LinkedAccountConnectorConfigValidationError,
    create_connector,
)
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    ListFilterParams,
    SelectField,
    SelectFieldInt,
    SelectOutput,
    SelectParams,
)
from wb.schemas.employee.fields import LinkedAccountSourceOut
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import make_id_output, make_list_output, make_select_output
from wb.utils.search import filter_to_query

from .schemas import LinkedAccountSourceCreate, LinkedAccountSourceUpdate

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/linked-account', tags=['v1', 'linked-account'])


@router.get('/source/select')
async def list_source_select(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    results = await session.scalars(
        sa.select(m.LinkedAccountSource)
        .where(m.LinkedAccountSource.name.ilike(f'%{query.search}%'))
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
                m.LinkedAccountSourceType,
            )
        ]
    )


@router.post('/source')
async def create_linked_account_source(
    body: LinkedAccountSourceCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj = m.LinkedAccountSource(
        type=m.LinkedAccountSourceType(body.type.value),
        name=body.name,
        description=body.description,
        config=body.config,
        active=body.active,
        public=body.public,
    )
    try:
        create_connector(obj)
    except LinkedAccountConnectorConfigValidationError as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail=f'{err}') from err
    session.add(obj)
    try:
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(HTTPStatus.CONFLICT, detail='duplicate') from err
    return make_id_output(obj.id)


@router.put('/source/{source_id}')
async def update_linked_account_source(
    source_id: int,
    body: LinkedAccountSourceUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj: m.LinkedAccountSource | None = await session.scalar(
        sa.select(m.LinkedAccountSource).where(m.LinkedAccountSource.id == source_id)
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Source not found')
    data: dict = body.dict(exclude_unset=True)
    if 'type' in data:
        obj.type = m.LinkedAccountSourceType(body.type.value)  # type: ignore[union-attr]
        data.pop('type')
    for k, v in data.items():
        setattr(obj, k, v)
    if session.is_modified(obj):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(HTTPStatus.CONFLICT, detail='duplicate') from err
    return make_id_output(obj.id)


@router.get('/source/list')
async def list_linked_account_source(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[LinkedAccountSourceOut]:
    q = sa.select(m.LinkedAccountSource)
    if query.filter:
        flt = filter_to_query(
            query.filter, m.LinkedAccountSource, available_fields=['name']
        )
        q = q.filter(flt)  # type: ignore
    count = await count_select_query_results(q, session=session)
    results = await session.scalars(
        q.order_by(m.LinkedAccountSource.name).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[LinkedAccountSourceOut.from_obj(obj) for obj in results.all()],
    )
