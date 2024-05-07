from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.schemas import BaseListOutput, BaseModelIdOutput, ListFilterParams
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import make_id_output, make_list_output
from wb.utils.search import filter_to_query

from .schemas import UsefulLinkCreate, UsefulLinkOut, UsefulLinkUpdate

__all__ = ('router',)


router = APIRouter(
    prefix='/api/v1/useful_link',
    tags=['v1', 'useful_link'],
)


@router.get('/list')
async def list_useful_links(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[UsefulLinkOut]:
    flt = sa.sql.true()
    if query.filter:
        flt = filter_to_query(
            query.filter, m.UsefulLink, available_fields=['name', 'link', 'description']
        )  # type: ignore
    sorts = (m.UsefulLink.name,)
    q = sa.select(m.UsefulLink).filter(flt)
    count = await count_select_query_results(q, session=session)
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[UsefulLinkOut.from_obj(link) for link in results.all()],
    )


@router.put('/{link_id}')
async def update_useful_link(
    link_id: int,
    body: UsefulLinkUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    obj: m.UsefulLink | None = await session.scalar(
        sa.select(m.UsefulLink).where(m.UsefulLink.id == link_id)
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
async def create_useful_link(
    body: UsefulLinkCreate, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    obj = m.UsefulLink(name=body.name, link=body.link, description=body.description)
    session.add(obj)
    await session.commit()
    return make_id_output(obj.id)


@router.delete('/{link_id}')
async def delete_useful_link(
    link_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj: m.UsefulLink | None = await session.scalar(
        sa.select(m.UsefulLink).where(m.UsefulLink.id == link_id)
    )
    if not obj:
        raise HTTPException(404, detail='Not Found')
    await session.delete(obj)
    await session.commit()
    return make_id_output(obj.id)
