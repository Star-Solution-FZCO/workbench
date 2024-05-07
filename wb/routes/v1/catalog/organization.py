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
    prefix='/api/v1/catalog/organization', tags=['v1', 'catalog', 'organization']
)


class OrganizationOut(BaseOutModel['m.Organization']):
    id: int
    name: str
    description: str | None = None
    is_archived: bool


class OrganizationCreate(BaseModel):
    name: str
    description: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


@router.get('/list')
async def list_organization(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[OrganizationOut]:
    flt = sa.sql.true()
    if query.filter:
        flt = filter_to_query(
            query.filter, m.Organization, available_fields=['name', 'is_archived']
        )  # type: ignore
    sorts = (m.Organization.name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.Organization,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['name'],
        )
    count_result = await session.execute(
        sa.select(sa.func.count())  # pylint: disable=not-callable
        .select_from(m.Organization)
        .filter(flt)
    )
    if (count := count_result.scalar()) is None:
        count = 0
    results = await session.scalars(
        sa.select(m.Organization)
        .filter(flt)
        .order_by(*sorts)
        .limit(query.limit)
        .offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[OrganizationOut.from_obj(r) for r in results.all()],
    )


@router.get('/select')
async def list_select_organization(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = sa.select(m.Organization).where(m.Organization.is_archived.is_(False))
    if query.search:
        q = q.filter(m.Organization.name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by('name').limit(10))
    return make_select_output(
        items=[
            SelectFieldInt.from_obj(obj, label='name', value='id')
            for obj in results.all()
        ]
    )


@router.get('/{org_id}')
async def get_organization(
    org_id: int, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[OrganizationOut]:
    organization = await session.scalar(
        sa.select(m.Organization).where(m.Organization.id == org_id)
    )
    if not organization:
        raise HTTPException(404, detail='Not Found')
    return make_success_output(payload=OrganizationOut.from_obj(organization))


@router.put('/{org_id}')
async def update_organization(
    org_id: int,
    body: OrganizationUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[OrganizationOut]:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    organization = await session.scalar(
        sa.select(m.Organization).where(m.Organization.id == org_id)
    )
    if not organization:
        raise HTTPException(404, detail='Not Found')
    for k, v in body.dict(exclude_unset=True).items():
        setattr(organization, k, v)
    if session.is_modified(organization):
        await session.commit()
    return make_success_output(payload=OrganizationOut.from_obj(organization))


@router.post('')
async def create_organization(
    body: OrganizationCreate, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[OrganizationOut]:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    try:
        obj = m.Organization(name=body.name, description=body.description)
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_success_output(payload=OrganizationOut.from_obj(obj))


@router.delete('/{org_id}')
async def archive_organization(
    org_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj = await session.scalar(
        sa.select(m.Organization).where(m.Organization.id == org_id)
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Not Found')
    if obj.is_archived:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Already archived')
    employee_count = await count_select_query_results(
        sa.select(m.Employee).where(m.Employee.organization_id == obj.id),
        session=session,
    )
    if employee_count:
        raise HTTPException(
            HTTPStatus.CONFLICT,
            detail=f'{employee_count} employees in this organization, it can not be archived',
        )
    obj.is_archived = True
    await session.commit()
    return make_id_output(obj.id)


@router.put('/{org_id}/restore')
async def restore_organization(
    org_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj = await session.scalar(
        sa.select(m.Organization).where(m.Organization.id == org_id)
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='Not Found')
    if not obj.is_archived:
        raise HTTPException(HTTPStatus.CONFLICT, detail='Not archived')
    obj.is_archived = False
    await session.commit()
    return make_id_output(obj.id)
