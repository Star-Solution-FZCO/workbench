import re
from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.schemas import SelectField, SelectOutput, SelectParams, SuccessPayloadOutput
from wb.utils.current_user import current_employee
from wb.utils.query import make_select_output, make_success_output

from .schemas import EmployeeRequestSettingsOut, EmployeeRequestSettingsUpdate

__all__ = ('router',)

router = APIRouter(prefix='/api/v1/request', tags=['v1', 'request'])


@router.get('/management-settings')
async def get_onboarding_settings(
    session: AsyncSession = Depends(get_db_session),
) -> SuccessPayloadOutput[EmployeeRequestSettingsOut]:
    settings = await session.scalar(sa.select(m.EmployeeRequestSettings))
    if settings is None:
        settings = m.EmployeeRequestSettings()
        session.add(settings)
        await session.commit()
    return make_success_output(payload=EmployeeRequestSettingsOut.from_obj(settings))


@router.put('/management-settings')
async def update_onboarding_settings(
    body: EmployeeRequestSettingsUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> SuccessPayloadOutput[EmployeeRequestSettingsOut]:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    settings = await session.scalar(sa.select(m.EmployeeRequestSettings))
    data = body.dict(exclude_unset=True)
    if settings is None:
        settings = m.EmployeeRequestSettings()
        session.add(settings)
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(settings, k, v)
    if session.is_modified(settings):
        await session.commit()
    return make_success_output(payload=EmployeeRequestSettingsOut.from_obj(settings))


@router.get('/select/types')
async def request_fields(query: SelectParams = Depends(SelectParams)) -> SelectOutput:
    return make_select_output(
        items=[
            SelectField(label=item.replace('_', ' ').strip().capitalize(), value=item)
            for item in filter(
                lambda t: re.match(f'.*{query.search}.*', t, re.IGNORECASE),
                m.REQUEST_TYPES,
            )
        ]
    )
