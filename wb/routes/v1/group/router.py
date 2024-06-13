import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import wb.models as m
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    BasePayloadOutput,
    ListFilterParams,
    SelectFieldInt,
    SelectOutput,
    SelectParams,
)
from wb.utils.current_user import current_employee, current_user
from wb.utils.db import count_select_query_results, resolve_db_ids
from wb.utils.query import (
    get_select_value,
    make_id_output,
    make_list_output,
    make_select_output,
    make_success_output,
)
from wb.utils.search import filter_to_query, sort_to_query

from .schemas import GroupCreate, GroupListItemOut, GroupOut, GroupUpdate

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/group', tags=['v1', 'group'])


@router.get('/list')
async def list_groups(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[GroupListItemOut]:
    curr_user = current_user()
    owner_filters = [m.Group.owner_id.is_(None)]
    if isinstance(curr_user, m.Employee):
        owner_filters.append(m.Group.owner_id == curr_user.id)
    q = sa.select(m.Group).where(sa.or_(*owner_filters))
    if query.filter:
        q = q.filter(filter_to_query(query.filter, m.Group, available_fields=['name']))  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.Group.name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.Group,
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
        items=[GroupListItemOut.from_obj(obj) for obj in results.all()],
    )


@router.get('/select')
async def list_select_groups(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    curr_user = current_employee()
    q = sa.select(m.Group).where(
        sa.or_(m.Group.owner_id == curr_user.id, m.Group.owner_id.is_(None))
    )
    if query.search:
        q = q.filter(m.Group.name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by('name').limit(10))
    return make_select_output(
        SelectFieldInt.from_obj(obj, label='name', value='id') for obj in results.all()
    )


@router.get('/{group_id}')
async def get_group(
    group_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[GroupOut]:
    q = (
        sa.select(m.Group)
        .where(m.Group.id == group_id)
        .options(selectinload(m.Group.members))
    )
    obj: m.Group | None = await session.scalar(q)
    if not obj:
        raise HTTPException(404, detail='Group not found')
    return make_success_output(payload=GroupOut.from_obj(obj))


@router.post('')
async def create_group(
    body: GroupCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if body.public and not curr_user.is_admin:
        raise HTTPException(403, detail='Only admin can create public groups')
    owner_id = None if body.public else curr_user.id
    try:
        obj = m.Group(
            owner_id=owner_id,
            name=body.name,
            members=await resolve_db_ids(
                m.Employee, map(get_select_value, body.members), session=session
            ),
        )
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.put('/{group_id}')
async def update_group(
    group_id: int,
    body: GroupUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    q = sa.select(m.Group).where(
        m.Group.id == group_id, m.Group.owner_id == curr_user.id
    )
    if curr_user.is_admin:
        q = sa.select(m.Group).where(
            m.Group.id == group_id,
            sa.or_(m.Group.owner_id == curr_user.id, m.Group.owner_id.is_(None)),
        )
    q = q.options(selectinload(m.Group.members))
    obj: m.Group | None = await session.scalar(q)
    if not obj:
        raise HTTPException(404, detail='Group not found')
    if body.public and not curr_user.is_admin:
        raise HTTPException(403, detail='Only admin can make groups public')
    data = body.dict(exclude_unset=True)
    if 'public' in data:
        obj.owner_id = None if body.public else curr_user.id
    if 'name' in data:
        obj.name = data['name']
    if 'members' in data:
        obj.members = await resolve_db_ids(
            m.Employee,
            map(get_select_value, body.members),
            session=session,  # type: ignore[arg-type]
        )
    if session.is_modified(obj):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.delete('/{group_id}')
async def delete_group(
    group_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    q = sa.select(m.Group).where(
        m.Group.id == group_id, m.Group.owner_id == curr_user.id
    )
    if curr_user.is_admin:
        q = sa.select(m.Group).where(
            m.Group.id == group_id,
            sa.or_(m.Group.owner_id == curr_user.id, m.Group.owner_id.is_(None)),
        )
    obj: m.Group | None = await session.scalar(q)
    if not obj:
        raise HTTPException(404, detail='Group not found')
    await session.delete(obj)
    await session.commit()
    return make_id_output(obj.id)
