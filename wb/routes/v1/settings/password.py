from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.config import CONFIG, AuthModeT
from wb.db import get_db_session
from wb.schemas import SuccessOutput
from wb.utils.current_user import current_employee

__all__ = ('router',)

router = APIRouter(
    prefix='/api/v1/settings/password', tags=['v1', 'settings', 'password']
)


class PasswordSetPayload(BaseModel):
    otp_code: str = Field(
        ..., min_length=CONFIG.OTP_DIGITS, max_length=CONFIG.OTP_DIGITS
    )
    password: str = Field(..., min_length=11)


@router.post('')
async def set_password(
    body: PasswordSetPayload,
    session: AsyncSession = Depends(get_db_session),
) -> SuccessOutput:
    if CONFIG.AUTH_MODE != AuthModeT.LOCAL:
        raise HTTPException(
            HTTPStatus.NOT_IMPLEMENTED, detail='password change is not supported'
        )
    curr_user = current_employee()
    if not (
        user := await session.scalar(
            sa.select(m.User).where(m.User.username == curr_user.account)
        )
    ):
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='User not found')
    otp_obj = await session.scalar(
        sa.select(m.EmployeeOTP).where(m.EmployeeOTP.employee_id == curr_user.id)
    )
    if not otp_obj:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='OTP not set')
    if not otp_obj.get_verifier().verify(body.otp_code):
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='OTP code is invalid')
    user.set_password(body.password)
    await session.commit()
    return SuccessOutput()
