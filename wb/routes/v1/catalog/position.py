import re
import typing as t
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
    SelectField,
    SelectFieldInt,
    SelectOutput,
    SelectParams,
)
from wb.utils.cache import get_key_builder_exclude_args, lru_cache
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import (
    get_select_value,
    make_id_output,
    make_list_output,
    make_select_output,
    make_success_output,
)
from wb.utils.search import filter_to_query, sort_to_query

__all__ = ('router',)


router = APIRouter(
    prefix='/api/v1/catalog/position', tags=['v1', 'catalog', 'position']
)


class PositionOut(BaseOutModel['m.Position']):
    id: int
    name: str
    description: str | None
    category: SelectField | None
    is_archived: bool

    @classmethod
    def from_obj(cls, obj: 'm.Position') -> t.Self:
        cat = (
            SelectField(label=obj.category, value=obj.category)
            if obj.category
            else None
        )
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            category=cat,
            is_archived=obj.is_archived,
        )


class PositionCreate(BaseModel):
    name: str
    description: str | None = None
    category: SelectField | None = None


class PositionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: SelectField | None = None


@router.get('/list')
async def list_positions(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[PositionOut]:
    flt = sa.sql.true()
    if query.filter:
        flt = filter_to_query(
            query.filter,
            m.Position,
            available_fields=['name', 'category', 'is_archived'],
        )  # type: ignore
    sorts = (m.Position.name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.Position,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['name'],
        )
    count_result = await session.execute(
        sa.select(sa.func.count())  # pylint: disable=not-callable
        .select_from(m.Position)
        .filter(flt)
    )
    if (count := count_result.scalar()) is None:
        count = 0
    results = await session.scalars(
        sa.select(m.Position)
        .filter(flt)
        .order_by(*sorts)
        .limit(query.limit)
        .offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[PositionOut.from_obj(r) for r in results.all()],
    )


@router.get('/select')
@lru_cache(ttl=2 * 60, key_builder=get_key_builder_exclude_args(('session',)))
async def list_select_positions(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = sa.select(m.Position).where(m.Position.is_archived.is_(False))
    if query.search:
        q = q.filter(m.Position.name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by('name'))
    return make_select_output(
        items=[
            SelectFieldInt.from_obj(obj, label='name', value='id')
            for obj in results.all()
        ]
    )


@router.get('/{position_id}')
async def get_position(
    position_id: int, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[PositionOut]:
    pos = await session.scalar(
        sa.select(m.Position).where(m.Position.id == position_id)
    )
    if not pos:
        raise HTTPException(404, detail='Not Found')
    return make_success_output(payload=PositionOut.from_obj(pos))


@router.put('/{position_id}')
async def update_position(
    position_id: int,
    body: PositionUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    pos = await session.scalar(
        sa.select(m.Position).where(m.Position.id == position_id)
    )
    if not pos:
        raise HTTPException(404, detail='Not Found')
    data = body.dict(exclude_unset=True)
    if 'category' in data:
        data['category'] = get_select_value(body.category) if body.category else None
    for k, v in data.items():
        setattr(pos, k, v)
    if session.is_modified(pos):
        await session.commit()
    return make_id_output(pos.id)


@router.post('')
async def create_position(
    body: PositionCreate, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    try:
        cat = get_select_value(body.category) if body.category else None
        obj = m.Position(name=body.name, description=body.description, category=cat)
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.get('/select/category')
async def list_category_select(
    query: SelectParams = Depends(SelectParams),
) -> SelectOutput:
    return make_select_output(
        items=[
            SelectField(label=cat, value=cat)
            for cat in filter(
                lambda t: re.match(f'.*{query.search}.*', t, re.IGNORECASE),
                m.POSITION_CATEGORIES,
            )
        ]
    )


@router.delete('/{position_id}')
async def archive_position(
    position_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj: m.Position | None = await session.scalar(
        sa.select(m.Position).where(m.Position.id == position_id)
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Not Found')
    if obj.is_archived:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Already archived')
    employee_count = await count_select_query_results(
        sa.select(m.Employee).where(m.Employee.position_id == obj.id), session=session
    )
    if employee_count:
        raise HTTPException(
            HTTPStatus.CONFLICT,
            detail=f'{employee_count} employees on this position, it can not be archived',
        )
    obj.is_archived = True
    await session.commit()
    return make_id_output(obj.id)


@router.put('/{position_id}/restore')
async def restore_position(
    position_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj: m.Position | None = await session.scalar(
        sa.select(m.Position).where(m.Position.id == position_id)
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Not Found')
    if not obj.is_archived:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Not archived')
    obj.is_archived = False
    await session.commit()
    return make_id_output(obj.id)
