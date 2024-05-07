from http import HTTPStatus
from typing import Self

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import wb.models as m
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    BaseOutModel,
    BasePayloadOutput,
    ListFilterParams,
    SelectFieldInt,
    SelectParams,
)
from wb.schemas.output import SuccessPayloadOutput
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
    prefix='/api/v1/catalog/team-tag', tags=['v1', 'catalog', 'team-tag']
)

COLOR_REGEX = r'^#[0-9a-fA-F]{6}$'


class TeamTagOut(BaseOutModel['m.TeamTag']):
    id: int
    name: str
    description: str
    color: str | None = Field(pattern=COLOR_REGEX)
    is_archived: bool


class TeamTagSelectOut(SelectFieldInt):
    description: str
    color: str | None = Field(None, pattern=COLOR_REGEX)

    @classmethod
    def from_obj(cls, obj: object, label: str, value: str) -> Self:
        return cls(
            label=str(getattr(obj, label)),
            value=getattr(obj, value),
            description=getattr(obj, 'description'),
            color=getattr(obj, 'color'),
        )


class TeamTagCreate(BaseModel):
    name: str
    description: str
    color: str | None = Field(None, pattern=COLOR_REGEX)


class TeamTagUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = Field(pattern=COLOR_REGEX)


@router.get('/list')
async def list_team_tags(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[TeamTagOut]:
    q = sa.select(m.TeamTag)
    if query.filter:
        flt = filter_to_query(
            query.filter, m.TeamTag, available_fields=['name', 'is_archived']
        )
        q = q.filter(flt)  # type: ignore
    sorts = (m.TeamTag.name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.TeamTag,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['name'],
        )
    cnt = await count_select_query_results(q, session=session)
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=cnt,
        limit=query.limit,
        offset=query.offset,
        items=[TeamTagOut.from_obj(r) for r in results.all()],
    )


@router.get('/select')
async def list_team_tags_select(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SuccessPayloadOutput[list[TeamTagSelectOut]]:
    q = sa.select(m.TeamTag)
    if query.search:
        q = q.where(m.TeamTag.name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by(m.TeamTag.name).limit(10))
    return make_select_output(
        items=[
            TeamTagSelectOut.from_obj(r, label='name', value='id')
            for r in results.all()
        ]
    )


@router.post('')
async def create_team_tag(
    body: TeamTagCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail='Forbidden')
    if not body.description:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST, detail='Description is required'
        )
    obj = m.TeamTag(
        name=body.name,
        description=body.description,
        color=body.color,
    )
    session.add(obj)
    try:
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(
            status_code=HTTPStatus.CONFLICT,
            detail='TeamTag with this name already exists',
        ) from err
    return make_id_output(obj.id)


@router.get('/{team_tag_id}')
async def get_team_tag(
    team_tag_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[TeamTagOut]:
    obj = await session.scalar(sa.select(m.TeamTag).where(m.TeamTag.id == team_tag_id))
    if not obj:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Not found')
    return make_success_output(payload=TeamTagOut.from_obj(obj))


@router.put('/{team_tag_id}')
async def update_team_tag(
    team_tag_id: int,
    body: TeamTagUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj = await session.scalar(sa.select(m.TeamTag).where(m.TeamTag.id == team_tag_id))
    if not obj:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail='Not found')
    if not body.description:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST, detail='Description is required'
        )
    if obj.is_archived:
        raise HTTPException(status_code=HTTPStatus.CONFLICT, detail='Archived')
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(obj, k, v)
    try:
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(
            status_code=HTTPStatus.CONFLICT,
            detail='TeamTag with this name already exists',
        ) from err
    return make_id_output(obj.id)


@router.delete('/{team_tag_id}')
async def archive_team_tag(
    team_tag_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj = await session.scalar(
        sa.select(m.TeamTag)
        .where(m.TeamTag.id == team_tag_id)
        .options(selectinload(m.TeamTag.teams))
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Not Found')
    if obj.is_archived:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Already archived')
    obj.teams = []
    obj.is_archived = True
    await session.commit()
    return make_id_output(obj.id)


@router.put('/{team_tag_id}/restore')
async def restore_team_tag(
    team_tag_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj = await session.scalar(sa.select(m.TeamTag).where(m.TeamTag.id == team_tag_id))
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Not Found')
    if not obj.is_archived:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Not archived')
    obj.is_archived = False
    await session.commit()
    return make_id_output(obj.id)
