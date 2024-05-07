from datetime import datetime
from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import timetracking.models as tmm
from timetracking.db import get_tm_db_session
from wb.db import get_db_session
from wb.schemas import BasePayloadOutput
from wb.services import get_employee_by_id
from wb.services.tm import (
    get_employee_tm_current_status,
    set_employee_tm_current_status,
)
from wb.utils.current_user import current_employee
from wb.utils.query import make_success_output

from .schemas import TMSetStatus, TMStatusOut

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/tm', tags=['v1', 'tm'])


@router.get('/status/{employee_id}')
async def get_employee_status(
    employee_id: int,
    session: AsyncSession = Depends(get_db_session),
    tm_session: AsyncSession = Depends(get_tm_db_session),
) -> BasePayloadOutput[TMStatusOut]:
    emp = await get_employee_by_id(employee_id, session=session)
    if not emp:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='employee not found')
    status, updated = await get_employee_tm_current_status(emp, session=tm_session)
    return make_success_output(
        payload=TMStatusOut(
            status=status,
            updated=updated,
        )
    )


@router.post('/status')
async def set_status(
    body: TMSetStatus,
    tm_session: AsyncSession = Depends(get_tm_db_session),
) -> BasePayloadOutput[TMStatusOut]:
    curr_user = current_employee()
    await tm_session.execute(
        sa.update(tmm.User)
        .where(tmm.User.email == curr_user.email)
        .values(lastLogin=datetime.utcnow())
    )
    await tm_session.commit()
    status, updated, is_changed = await set_employee_tm_current_status(
        curr_user, body.status, body.source, session=tm_session
    )
    output_payload = TMStatusOut(
        status=status,
        updated=updated,
    )
    if not is_changed:
        raise HTTPException(
            HTTPStatus.CONFLICT, detail=f'can\'t change status from "{status.value}"'
        )
    return make_success_output(payload=output_payload)
