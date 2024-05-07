import re
import typing as t
from datetime import date

import sqlalchemy as sa
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    ListFilterParams,
    SelectField,
    SelectOutput,
    SelectParams,
)
from wb.utils.query import make_select_output
from wb.utils.search import filter_to_query

from .members import generate_members_report

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/report/team', tags=['v1', 'report'])

REPORT_TYPES: dict[str, str] = {
    'members-report': 'Members report',
}


def _get_team_filter(query_filter: str | None) -> t.Any:
    """
    Return a SQLAlchemy filter expression based on the given query filter.

    :param query_filter: A string representing the query filter.
    :type query_filter: str or None
    :return: A SQLAlchemy filter expression.
    :rtype: Any
    """
    if not query_filter:
        return sa.sql.true()
    return filter_to_query(
        query_filter,
        m.Team,
        available_fields=['id', 'name', 'key'],
    )  # type: ignore


@router.get('/select')
async def list_report_type(query: SelectParams = Depends(SelectParams)) -> SelectOutput:
    return make_select_output(
        items=[
            SelectField(label=v, value=k)
            for k, v in REPORT_TYPES.items()
            if re.match(f'.*{query.search}.*', v, re.IGNORECASE)
        ]
    )


@router.get('/members-report')
async def get_members_report(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput:
    flt = _get_team_filter(query.filter)
    report = await generate_members_report(flt, start, end, session=session)
    return report.make_list_output()


@router.get('/members-report/csv')
async def get_day_off_report_csv(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    flt = _get_team_filter(query.filter)
    report = await generate_members_report(flt, start, end, session=session)
    output = report.make_csv()
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv')
