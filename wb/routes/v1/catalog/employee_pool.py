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
from wb.utils.current_user import current_employee, current_user
from wb.utils.db import count_select_query_results
from wb.utils.query import (
    make_id_output,
    make_list_output,
    make_select_output,
    make_success_output,
)
from wb.utils.search import filter_to_query

router = APIRouter(
    prefix='/api/v1/catalog/employee-pool', tags=['v1', 'catalog', 'employee-pool']
)


class EmployeePoolOut(BaseOutModel['m.EmployeePool']):
    id: int
    name: str


class EmployeePoolCreate(BaseModel):
    name: str


class EmployeePoolUpdate(BaseModel):
    name: str | None = None


@router.get('/list')
async def list_employee_pool(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[EmployeePoolOut]:
    curr_user = current_user()
    user_roles = set(curr_user.roles)
    has_access = bool(
        {'admin', 'hr', 'recruiter', 'super_admin', 'super_hr'}.intersection(user_roles)
    )
    if not has_access:
        raise HTTPException(
            status_code=403,
            detail='Only admins, hrs and recruiters can access to employee pool list',
        )
    q = sa.select(m.EmployeePool)
    if query.filter:
        flt = filter_to_query(query.filter, m.EmployeePool, available_fields=['name'])
        q = q.filter(flt)  # type: ignore
    cnt = await count_select_query_results(q, session)
    results = await session.scalars(
        q.order_by(m.EmployeePool.name).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=cnt,
        limit=query.limit,
        offset=query.offset,
        items=[EmployeePoolOut.from_obj(obj) for obj in results.all()],
    )


@router.get('/select')
async def list_employee_pool_select(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    curr_user = current_user()
    user_roles = set(curr_user.roles)
    has_access = bool(
        {'admin', 'hr', 'recruiter', 'super_admin', 'super_hr'}.intersection(user_roles)
    )
    if not has_access:
        raise HTTPException(
            status_code=403,
            detail='Only admins, hrs and recruiters can access to employee pool select',
        )
    q = sa.select(m.EmployeePool)
    if query.search:
        q = q.where(m.EmployeePool.name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by(m.EmployeePool.name).limit(10))
    return make_select_output(
        items=[
            SelectFieldInt.from_obj(s, label='name', value='id') for s in results.all()
        ]
    )


@router.post('/')
async def create_employee_pool(
    body: EmployeePoolCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_super_admin:
        raise HTTPException(
            status_code=403, detail='Only super admin can create employee pool'
        )
    employee_pool = m.EmployeePool(name=body.name)
    session.add(employee_pool)
    try:
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(
            status_code=400, detail='Employee pool already exists'
        ) from err
    return make_id_output(employee_pool.id)


@router.get('/{employee_pool_id}')
async def get_employee_pool(
    employee_pool_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[EmployeePoolOut]:
    curr_user = current_user()
    user_roles = set(curr_user.roles)
    has_access = bool(
        {'admin', 'hr', 'recruiter', 'super_admin', 'super_hr'}.intersection(user_roles)
    )
    if not has_access:
        raise HTTPException(
            status_code=403,
            detail='Only admins, hrs and recruiters can access to employee pool',
        )
    employee_pool = await session.scalar(
        sa.select(m.EmployeePool).where(m.EmployeePool.id == employee_pool_id)
    )
    if not employee_pool:
        raise HTTPException(status_code=404, detail='Employee pool not found')
    return make_success_output(payload=EmployeePoolOut.from_obj(employee_pool))


@router.put('/{employee_pool_id}')
async def update_employee_pool(
    employee_pool_id: int,
    body: EmployeePoolUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_super_admin:
        raise HTTPException(
            status_code=403, detail='Only super admin can update employee pool'
        )
    employee_pool = await session.scalar(
        sa.select(m.EmployeePool).where(m.EmployeePool.id == employee_pool_id)
    )
    if not employee_pool:
        raise HTTPException(status_code=404, detail='Employee pool not found')
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(employee_pool, k, v)
    if not session.is_modified(employee_pool):
        return make_id_output(employee_pool.id)
    try:
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(
            status_code=400, detail='Employee pool already exists'
        ) from err
    return make_id_output(employee_pool.id)
