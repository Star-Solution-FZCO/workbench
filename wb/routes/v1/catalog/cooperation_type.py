from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    BaseOutModel,
    BasePayloadOutput,
    ListFilterParams,
    SelectFieldInt,
    SelectOutput,
    SelectParams,
)
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import (
    make_id_output,
    make_list_output,
    make_select_output,
    make_success_output,
)
from wb.utils.search import filter_to_query, sort_to_query

__all__ = ('router',)


router = APIRouter(
    prefix='/api/v1/catalog/cooperation_type',
    tags=['v1', 'catalog', 'cooperation_type'],
)


class CooperationTypeOut(BaseOutModel['m.CooperationType']):
    id: int
    name: str
    description: str | None
    is_archived: bool


class CooperationTypeCreate(BaseModel):
    name: str
    description: str | None = None


class CooperationTypeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


@router.get('/list')
async def list_cooperation_type(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[CooperationTypeOut]:
    flt = sa.sql.true()
    if query.filter:
        flt = filter_to_query(
            query.filter, m.CooperationType, available_fields=['name', 'is_archived']
        )  # type: ignore
    sorts = (m.CooperationType.name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.CooperationType,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['name'],
        )
    count_result = await session.execute(
        sa.select(sa.func.count())  # pylint: disable=not-callable
        .select_from(m.CooperationType)
        .filter(flt)
    )
    if (count := count_result.scalar()) is None:
        count = 0
    results = await session.scalars(
        sa.select(m.CooperationType)
        .filter(flt)
        .order_by(*sorts)
        .limit(query.limit)
        .offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[CooperationTypeOut.from_obj(r) for r in results.all()],
    )


@router.get('/select')
async def list_select_cooperation_type(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = sa.select(m.CooperationType).where(m.CooperationType.is_archived.is_(False))
    if query.search:
        q = q.filter(m.CooperationType.name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by('name').limit(10))
    return make_select_output(
        items=[
            SelectFieldInt.from_obj(obj, label='name', value='id')
            for obj in results.all()
        ]
    )


@router.get('/{coop_type_id}')
async def get_cooperation_type(
    coop_type_id: int, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[CooperationTypeOut]:
    obj = await session.scalar(
        sa.select(m.CooperationType).where(m.CooperationType.id == coop_type_id)
    )
    if not obj:
        raise HTTPException(404, detail='Not Found')
    return make_success_output(payload=CooperationTypeOut.from_obj(obj))


@router.put('/{coop_type_id}')
async def update_cooperation_type(
    coop_type_id: int,
    body: CooperationTypeUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    obj = await session.scalar(
        sa.select(m.CooperationType).where(m.CooperationType.id == coop_type_id)
    )
    if not obj:
        raise HTTPException(404, detail='Not Found')
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(obj, k, v)
    if session.is_modified(obj):
        await session.commit()
    return make_id_output(obj.id)


@router.post('')
async def create_cooperation_type(
    body: CooperationTypeCreate, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    try:
        obj = m.CooperationType(name=body.name, description=body.description)
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.delete('/{coop_type_id}')
async def archive_cooperation_type(
    coop_type_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj = await session.scalar(
        sa.select(m.CooperationType).where(m.CooperationType.id == coop_type_id)
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Not Found')
    if obj.is_archived:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Already archived')
    employee_count = await count_select_query_results(
        sa.select(m.Employee).where(m.Employee.cooperation_type_id == obj.id),
        session=session,
    )
    if employee_count:
        raise HTTPException(
            HTTPStatus.CONFLICT,
            detail=f'{employee_count} employees have this cooperation type, it can not be archived',
        )
    obj.is_archived = True
    await session.commit()
    return make_id_output(obj.id)


@router.put('/{coop_type_id}/restore')
async def restore_cooperation_type(
    coop_type_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj = await session.scalar(
        sa.select(m.CooperationType).where(m.CooperationType.id == coop_type_id)
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Not Found')
    if not obj.is_archived:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Not archived')
    obj.is_archived = False
    await session.commit()
    return make_id_output(obj.id)
