import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.activity_collector.models import EmployeeActivitySourceAlias
from wb.db import get_db_session
from wb.schemas import ActivityOut, BaseListOutput, ListFilterParams, SelectFieldInt
from wb.services import get_employee_by_id
from wb.utils.db import count_select_query_results
from wb.utils.query import make_list_output
from wb.utils.search import filter_to_query, sort_to_query

__all__ = ('router',)


router = APIRouter(
    prefix='/api/v1/employee/{employee_id}/activity', tags=['v1', 'activity']
)


class EmployeeActivitySourceAliasOut(BaseModel):
    source: SelectFieldInt
    alias: str | None


@router.get('/list')
async def list_activities(
    employee_id: int,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[ActivityOut]:
    if not (emp := await get_employee_by_id(employee_id, session=session)):
        raise HTTPException(404, detail='employee not found')
    flt = m.Activity.employee_id == emp.id
    if query.filter:
        flt = sa.and_(
            flt,
            filter_to_query(
                query.filter, m.Activity, available_fields=['time', 'source_id']
            ),  # type: ignore
        )
    sorts = (m.Activity.time.desc(),)
    if query.sort_by:
        sorts = sort_to_query(m.Activity, query.sort_by, available_sort_fields=['time'])
    q = sa.select(m.Activity).filter(flt)
    count = await count_select_query_results(q, session=session)
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[ActivityOut.from_obj(act) for act in results.all()],
    )


@router.get('/alias/list')
async def get_employee_aliases(
    employee_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[EmployeeActivitySourceAliasOut]:
    if not (emp := await get_employee_by_id(employee_id, session=session)):
        raise HTTPException(404, detail='employee not found')
    results_raw = await session.execute(
        sa.select(
            m.ActivitySource,
            EmployeeActivitySourceAlias.alias,
        ).outerjoin(
            EmployeeActivitySourceAlias,
            sa.and_(
                EmployeeActivitySourceAlias.source_id == m.ActivitySource.id,
                EmployeeActivitySourceAlias.employee_id == emp.id,
            ),
        )
    )
    results = results_raw.all()
    return make_list_output(
        count=0,
        limit=0,
        offset=0,
        items=[
            EmployeeActivitySourceAliasOut(
                source=SelectFieldInt.from_obj(source, label='name', value='id'),
                alias=alias,
            )
            for source, alias in results
        ],
    )
