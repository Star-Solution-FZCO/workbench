from datetime import datetime
from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
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


@router.get('/status/{employee_id}/manual')
async def get_employee_status_manual(
    employee_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[TMStatusOut]:
    emp = await get_employee_by_id(employee_id, session=session)
    if not emp:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='employee not found')
    last_log: m.TMRecord | None = await session.scalar(
        sa.select(m.TMRecord)
        .where(
            m.TMRecord.employee_id == emp.id,
            m.TMRecord.status.in_((m.TMRecordType.LEAVE, m.TMRecordType.COME)),
            m.TMRecord.source != 'auto',
        )
        .order_by(m.TMRecord.time.desc())
        .limit(1)
    )
    if not last_log:
        payload = TMStatusOut(
            status=m.TMRecordType.LEAVE,
            updated=None,
        )
    else:
        payload = TMStatusOut(
            status=last_log.status,
            updated=last_log.time,
        )
    return make_success_output(payload=payload)


@router.get('/status/{employee_id}')
async def get_employee_status(
    employee_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[TMStatusOut]:
    emp = await get_employee_by_id(employee_id, session=session)
    if not emp:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='employee not found')
    status, updated = await get_employee_tm_current_status(emp, session=session)
    return make_success_output(
        payload=TMStatusOut(
            status=status,
            updated=updated,
        )
    )


@router.post('/status')
async def set_status(
    body: TMSetStatus,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[TMStatusOut]:
    curr_user = current_employee()
    await session.execute(
        sa.update(m.EmployeeTM)
        .where(m.EmployeeTM.employee_id == curr_user.id)
        .values(last_logon=datetime.utcnow())
    )
    await session.commit()
    status, updated, is_changed = await set_employee_tm_current_status(
        curr_user, body.status, body.source, session=session
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
