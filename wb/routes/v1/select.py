import re

from fastapi import APIRouter, Depends

from wb.schemas import SelectField, SelectOutput, SelectParams
from wb.utils.query import make_select_output
from wb.utils.timezone import get_timezones

__all__ = ('router',)

router = APIRouter(prefix='/api/v1/select', tags=['v1', 'select'])


@router.get('/timezone')
async def timezones_list(query: SelectParams = Depends(SelectParams)) -> SelectOutput:
    return make_select_output(
        items=[
            SelectField(label=r, value=r)
            for r in filter(
                lambda t: re.match(f'.*{query.search}.*', t, re.IGNORECASE),
                get_timezones(),
            )
        ]
    )
