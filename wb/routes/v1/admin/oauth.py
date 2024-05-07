from http import HTTPStatus
from secrets import token_hex, token_urlsafe

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
)
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import make_id_output, make_list_output, make_success_output
from wb.utils.search import filter_to_query, sort_to_query

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/admin/oauth/client')


class OAuthClientOut(BaseOutModel[m.OAuthClient]):
    id: int
    client_id: str
    grant_types: list[m.OAuthGrantType]
    response_types: list[m.OAuthResponseType]
    redirect_uris: list[str]
    scope: str
    active: bool


class OAuthClientCreate(BaseModel):
    name: str
    redirect_uris: list[str]


class OAuthClientCreatedOut(BaseOutModel[m.OAuthClient]):
    id: int
    client_id: str
    client_secret: str


class OAuthClientUpdate(BaseModel):
    name: str | None = None
    redirect_uris: list[str] | None = None


@router.get('/list')
async def get_client_list(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[OAuthClientOut]:
    q = sa.select(m.OAuthClient)
    if query.filter:
        flt = filter_to_query(
            query.filter, m.OAuthClient, available_fields=['name', 'client_id']
        )
        q = q.filter(flt)  # type: ignore[arg-type]
    sorts = (m.OAuthClient.name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.OAuthClient,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['name', 'client_id'],
        )
    count = await count_select_query_results(q, session=session)
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[OAuthClientOut.from_obj(obj) for obj in results.all()],
    )


@router.post('')
async def create_client(
    body: OAuthClientCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[OAuthClientCreatedOut]:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='admins only')
    obj = m.OAuthClient(
        client_id=token_hex(8),
        client_secret=token_urlsafe(32),
        name=body.name,
        grant_types=[m.OAuthGrantType.AUTHORIZATION_CODE],
        response_types=[m.OAuthResponseType.CODE, m.OAuthResponseType.ID_TOKEN],
        redirect_uris=body.redirect_uris,
        scope='openid',
        created_by_id=curr_user.id,
    )
    try:
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            detail='db integrity error',
        ) from err
    return make_success_output(payload=OAuthClientCreatedOut.from_obj(obj))


@router.delete('/{id_}')
async def disable_client(
    id_: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='admins only')
    obj = await session.scalar(sa.select(m.OAuthClient).where(m.OAuthClient.id == id_))
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='client not found')
    await session.delete(obj)
    await session.commit()
    return make_id_output(obj.id)


@router.put('/{id_}')
async def update_client(
    id_: int,
    body: OAuthClientUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='admins only')
    obj = await session.scalar(sa.select(m.OAuthClient).where(m.OAuthClient.id == id_))
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='client not found')
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(obj, k, v)
    if session.is_modified(obj):
        await session.commit()
    return make_id_output(obj.id)
