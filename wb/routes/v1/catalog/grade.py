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
    BaseOutModel,
    BasePayloadOutput,
    ListFilterParams,
    SelectField,
    SelectOutput,
    SelectParams,
)
from wb.utils.current_user import current_employee
from wb.utils.query import make_list_output, make_select_output, make_success_output

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/catalog/grade', tags=['v1', 'catalog', 'grade'])


class GradeOut(BaseOutModel['m.Grade']):
    id: int
    name: str
    description: str | None = None


class GradeCreate(BaseModel):
    name: str
    description: str | None = None


class GradeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


@router.get('/list')
async def list_grades(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[GradeOut]:
    count_result = await session.execute(
        sa.select(sa.func.count()).select_from(m.Grade)  # pylint: disable=not-callable
    )
    if (count := count_result.scalar()) is None:
        count = 0
    results = await session.scalars(
        sa.select(m.Grade).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[GradeOut.from_obj(r) for r in results.all()],
    )


@router.get('/select')
async def select_grades(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = sa.select(m.Grade)
    if query.search:
        q = q.filter(m.Grade.name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by('name').limit(10))
    return make_select_output(
        items=[
            SelectField(label=sg['name'], value=sg['name'])
            for gr in results.all()
            for sg in gr.sub_grades
        ]
    )  # type: ignore


@router.get('/{grade_id}')
async def get_grade(
    grade_id: int, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[GradeOut]:
    grade = await session.scalar(sa.select(m.Grade).where(m.Grade.id == grade_id))
    if not grade:
        raise HTTPException(404, detail='Not Found')
    return make_success_output(payload=GradeOut.from_obj(grade))


@router.put('/{grade_id}')
async def update_grade(
    grade_id: int, body: GradeUpdate, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[GradeOut]:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    grade = await session.scalar(sa.select(m.Grade).where(m.Grade.id == grade_id))
    if not grade:
        raise HTTPException(404, detail='Not Found')
    for k, v in body.dict(exclude_unset=True).items():
        setattr(grade, k, v)
    if session.is_modified(grade):
        await session.commit()
    return make_success_output(payload=GradeOut.from_obj(grade))


@router.post('')
async def create_grade(
    body: GradeCreate, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[GradeOut]:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    try:
        obj = m.Grade(name=body.name, description=body.description)
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_success_output(payload=GradeOut.from_obj(obj))
