from datetime import datetime

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    BasePayloadOutput,
    ListFilterParams,
)
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import make_id_output, make_list_output, make_success_output
from wb.utils.search import filter_to_query, sort_to_query

from .schemas import APITokenCreate, APITokenCreatedOut, APITokenOut

__all__ = ('router',)

router = APIRouter(
    prefix='/api/v1/settings/api-token', tags=['v1', 'settings', 'api-token']
)


@router.get('/list')
async def list_api_tokens(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[APITokenOut]:
    curr_user = current_employee()
    q = sa.select(m.APIToken).where(m.APIToken.owner_id == curr_user.id)
    if query.filter:
        q = q.filter(
            filter_to_query(query.filter, m.APIToken, available_fields=['name'])
        )  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.APIToken.created.desc(),)
    if query.sort_by:
        sorts = sort_to_query(
            m.APIToken,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['name', 'created'],
        )
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[APITokenOut.from_obj(obj) for obj in results.all()],
    )


@router.post('')
async def create_api_token(
    body: APITokenCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[APITokenCreatedOut]:
    curr_user = current_employee()
    obj = m.APIToken.create(
        name=body.name,
        owner=curr_user,
        created=datetime.utcnow(),
        expires_in=body.expires_in,
    )
    session.add(obj)
    await session.commit()
    return make_success_output(payload=APITokenCreatedOut.from_obj(obj))


@router.delete('/{token_id}')
async def revoke_token(
    token_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    obj = await session.scalar(
        sa.select(m.APIToken).where(
            m.APIToken.id == token_id, m.APIToken.owner_id == curr_user.id
        )
    )
    if not obj:
        raise HTTPException(404, detail='Token not found')
    await session.delete(obj)
    await session.commit()
    return make_id_output(obj.id)
