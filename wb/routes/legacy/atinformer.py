from datetime import datetime

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.services.tm import (
    get_employee_tm_current_status,
    set_employee_tm_current_status,
)

from ._base import HEADERS, auth_tm_user

__all__ = ('router',)


router = APIRouter(prefix='/tm/attendance/atinformer.php')


@router.post('')
async def atinformer(
    req: Request,
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    body = await req.form()
    emp = await auth_tm_user(body, session=session)
    if not emp:
        return Response(
            b'Not logged in',
            headers=HEADERS,
        )
    if not body.get('notACall'):
        emp.tm.last_logon = datetime.utcnow()
        await session.commit()
    todo = body.get('todo')
    if todo == 'come':
        current_status, status_time, _ = await set_employee_tm_current_status(
            emp, m.TMRecordType.COME, source='tm', session=session
        )
    elif todo == 'go':
        current_status, status_time, _ = await set_employee_tm_current_status(
            emp, m.TMRecordType.LEAVE, source='tm', session=session
        )
    elif todo == 'awake':
        current_status, status_time, _ = await set_employee_tm_current_status(
            emp, m.TMRecordType.AWAKE, source='tm', session=session
        )
    elif todo == 'away':
        current_status, status_time, _ = await set_employee_tm_current_status(
            emp, m.TMRecordType.AWAY, source='tm', session=session
        )
    else:
        current_status, status_time = await get_employee_tm_current_status(
            emp, session=session
        )  # type: ignore
    if current_status == m.TMRecordType.AWAY:
        if body.get('notACall'):
            away_seconds = (
                (datetime.utcnow() - status_time).total_seconds() if status_time else 0
            )
            res = f'away {away_seconds / 60} min'.encode()
        else:
            res = b'Away'
    else:
        if current_status in (
            m.TMRecordType.AWAKE,
            m.TMRecordType.COME,
        ):
            res = b'Here'
        else:
            res = b'Out'
    return Response(
        res,
        headers=HEADERS,
    )
