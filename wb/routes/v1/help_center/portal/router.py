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
from wb.schemas.params import SelectParams
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import (
    make_id_output,
    make_list_output,
    make_select_output,
    make_success_output,
)
from wb.utils.search import filter_to_query, sort_to_query

from .schemas import (
    PortalCreate,
    PortalGroupCreate,
    PortalGroupOut,
    PortalGroupUpdate,
    PortalOut,
    PortalUpdate,
)

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/help-center/portal', tags=['v1', 'portal'])


@router.get('/list')
async def list_portals(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[PortalOut]:
    q = sa.select(m.Portal)
    if query.filter:
        q = q.filter(
            filter_to_query(
                query.filter, m.Portal, available_fields=['name', 'is_active']
            )
        )  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.Portal.name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.Portal,
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
        items=[PortalOut.from_obj(obj) for obj in results.all()],
    )


@router.get('/select')
async def portal_select(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = sa.select(m.Portal).where(m.Portal.is_active.is_(True))
    if query.search:
        q = q.filter(m.Portal.name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by('name').limit(10))
    return make_select_output(
        items=[
            SelectFieldInt.from_obj(obj, label='name', value='id')
            for obj in results.all()
        ]
    )


@router.get('/{portal_id}')
async def get_portal(
    portal_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[PortalOut]:
    obj: m.Portal | None = await session.scalar(
        sa.select(m.Portal).where(m.Portal.id == portal_id)
    )
    if not obj:
        raise HTTPException(404, detail='Portal not found')
    return make_success_output(payload=PortalOut.from_obj(obj))


@router.post('')
async def create_portal(
    body: PortalCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    try:
        obj = m.Portal(
            name=body.name,
            description=body.description,
            confluence_space_keys=body.confluence_space_keys,
            youtrack_project=body.youtrack_project,
        )
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.put('/{portal_id}')
async def update_portal(
    portal_id: int,
    body: PortalUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    obj: m.Portal | None = await session.scalar(
        sa.select(m.Portal).where(m.Portal.id == portal_id)
    )
    if not obj:
        raise HTTPException(404, detail='Portal not found')
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(obj, k, v)
    if session.is_modified(obj):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.delete('/{portal_id}')
async def delete_portal(
    portal_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    obj: m.Portal | None = await session.scalar(
        sa.select(m.Portal).where(m.Portal.id == portal_id)
    )
    if not obj:
        raise HTTPException(404, detail='Portal not found')
    obj.is_active = False
    await session.commit()
    return make_id_output(obj.id)


@router.get('/group/list')
async def list_portal_groups(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[PortalGroupOut]:
    q = sa.select(m.PortalGroup)
    if query.filter:
        q = q.filter(
            filter_to_query(
                query.filter,
                m.PortalGroup,
                available_fields=['name', 'portal_id', 'is_active'],
            )
        )  # type: ignore
    sorts = (m.PortalGroup.name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.PortalGroup,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['name'],
        )
    count = await count_select_query_results(q, session=session)
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[PortalGroupOut.from_obj(obj) for obj in results.all()],
    )


@router.get('/{portal_id}/group/select')
async def portal_group_select(
    portal_id: int,
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = sa.select(m.PortalGroup).where(
        sa.and_(m.PortalGroup.portal_id == portal_id, m.Portal.is_active.is_(True))
    )
    if query.search:
        q = q.filter(m.PortalGroup.name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by('name').limit(10))
    return make_select_output(
        items=[
            SelectFieldInt.from_obj(obj, label='name', value='id')
            for obj in results.all()
        ]
    )


@router.get('/group/{portal_group_id}')
async def get_portal_group(
    portal_group_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[PortalGroupOut]:
    obj: m.PortalGroup | None = await session.scalar(
        sa.select(m.PortalGroup).where(m.PortalGroup.id == portal_group_id)
    )
    if not obj:
        raise HTTPException(404, detail='Portal group not found')
    return make_success_output(payload=PortalGroupOut.from_obj(obj))


@router.post('/group')
async def create_portal_group(
    body: PortalGroupCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    try:
        obj = m.PortalGroup(name=body.name, portal_id=body.portal_id)
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.put('/group/{portal_group_id}')
async def update_portal_group(
    portal_group_id: int,
    body: PortalGroupUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    obj: m.PortalGroup | None = await session.scalar(
        sa.select(m.PortalGroup).where(m.PortalGroup.id == portal_group_id)
    )
    if not obj:
        raise HTTPException(404, detail='Portal group not found')
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(obj, k, v)
    if session.is_modified(obj):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.delete('/group/{portal_group_id}')
async def delete_portal_group(
    portal_group_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    obj: m.PortalGroup | None = await session.scalar(
        sa.select(m.PortalGroup).where(m.PortalGroup.id == portal_group_id)
    )
    if not obj:
        raise HTTPException(404, detail='Portal group not found')
    obj.is_active = False
    await session.commit()
    return make_id_output(obj.id)
