import typing as t
from datetime import date
from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends
from fastapi.exceptions import HTTPException
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
from wb.utils.query import (
    make_id_output,
    make_list_output,
    make_select_output,
    make_success_output,
)
from wb.utils.search import filter_to_query, sort_to_query

__all__ = ('router',)


router = APIRouter(
    prefix='/api/v1/catalog/holiday_set', tags=['v1', 'catalog', 'holiday']
)


class HolidayOut(BaseOutModel['m.Holiday']):
    day: date
    name: str
    is_working: bool


class HolidayCreate(BaseModel):
    day: date
    name: str
    is_working: bool = False


class HolidaySetOut(BaseOutModel['m.HolidaySet']):
    id: int
    name: str
    description: str | None = None
    holidays: list[HolidayOut]
    is_default: bool

    @classmethod
    def from_obj(cls, obj: 'm.HolidaySet') -> t.Self:
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            holidays=[HolidayOut.from_obj(h) for h in obj.holidays],
            is_default=obj.is_default,
        )


class HolidaySetCreate(BaseModel):
    name: str
    description: str | None = None


class HolidaySetUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class SetDefaultBody(BaseModel):
    id: int


@router.get('/list')
async def list_holiday_sets(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[HolidaySetOut]:
    flt = sa.sql.true()
    if query.filter:
        flt = filter_to_query(query.filter, m.HolidaySet, available_fields=['name'])  # type: ignore
    sorts = (m.HolidaySet.name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.HolidaySet,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['name'],
        )
    count_result = await session.execute(
        sa.select(sa.func.count())  # pylint: disable=not-callable
        .select_from(m.HolidaySet)
        .filter(flt)
    )
    if (count := count_result.scalar()) is None:
        count = 0
    results = await session.scalars(
        sa.select(m.HolidaySet)
        .filter(flt)
        .order_by(*sorts)
        .limit(query.limit)
        .offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[HolidaySetOut.from_obj(r) for r in results.all()],
    )


@router.get('/select')
async def select_holiday_set(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = sa.select(m.HolidaySet)
    if query.search:
        q = q.filter(m.HolidaySet.name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by('name').limit(10))
    return make_select_output(
        items=[
            SelectFieldInt.from_obj(obj, label='name', value='id')
            for obj in results.all()
        ]
    )


@router.put('/set-default')
async def set_default_holiday_set(
    body: SetDefaultBody,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_super_hr:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='forbidden')
    holiday_set: 'm.HolidaySet | None' = await session.scalar(
        sa.select(m.HolidaySet).where(m.HolidaySet.id == body.id)
    )
    if not holiday_set:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Not Found')
    if holiday_set.is_default:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Already a default')
    curr_default: 'm.HolidaySet | None' = await session.scalar(
        sa.select(m.HolidaySet).where(m.HolidaySet.is_default.is_(True))
    )
    if curr_default:
        curr_default.is_default = False
    holiday_set.is_default = True
    await session.commit()
    return make_id_output(holiday_set.id)


@router.get('/{holiday_set_id}')
async def get_holiday_set(
    holiday_set_id: int, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[HolidaySetOut]:
    holiday_set = await session.scalar(
        sa.select(m.HolidaySet).where(m.HolidaySet.id == holiday_set_id)
    )
    if not holiday_set:
        raise HTTPException(404, detail='Not Found')
    return make_success_output(payload=HolidaySetOut.from_obj(holiday_set))


@router.put('/{holiday_set_id}')
async def update_holiday_set(
    holiday_set_id: int,
    body: HolidaySetUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    holiday_set = await session.scalar(
        sa.select(m.HolidaySet).where(m.HolidaySet.id == holiday_set_id)
    )
    if not holiday_set:
        raise HTTPException(404, detail='Not Found')
    for k, v in body.dict(exclude_unset=True).items():
        setattr(holiday_set, k, v)
    if session.is_modified(holiday_set):
        await session.commit()
    return make_id_output(holiday_set.id)


@router.post('/{holiday_set_id}/day')
async def create_holiday_set_day(
    holiday_set_id: int,
    body: HolidayCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    holiday_set: 'm.HolidaySet | None' = await session.scalar(
        sa.select(m.HolidaySet).where(m.HolidaySet.id == holiday_set_id)
    )
    if not holiday_set:
        raise HTTPException(404, detail='Not Found')
    created_holiday = m.Holiday(
        holiday_set_id=holiday_set.id,
        name=body.name,
        day=body.day,
        type=m.DayType.WORKING_DAY if body.is_working else m.DayType.HOLIDAY,
    )
    session.add(created_holiday)
    holiday_set.holidays.append(created_holiday)
    if session.is_modified(holiday_set):
        await session.commit()
    return make_id_output(holiday_set.id)


@router.post('')
async def create_holiday_set(
    body: HolidaySetCreate, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    try:
        obj = m.HolidaySet(name=body.name, description=body.description)
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.delete('/{holiday_set_id}/day')
async def delete_holiday_set_day(
    holiday_set_id: int, day: date, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    holiday_set: 'm.HolidaySet | None' = await session.scalar(
        sa.select(m.HolidaySet).where(m.HolidaySet.id == holiday_set_id)
    )
    if not holiday_set:
        raise HTTPException(404, detail='Not Found')
    holiday_set.holidays = list(filter(lambda hd: hd.day != day, holiday_set.holidays))
    if session.is_modified(holiday_set):
        await session.commit()
    return make_id_output(holiday_set_id)
