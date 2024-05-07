from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starsol_otp import generate_random_base32_secret

import wb.models as m
from wb.db import get_db_session
from wb.schemas import BasePayloadOutput, SuccessOutput
from wb.utils.current_user import current_employee
from wb.utils.query import make_success_output

from .schemas import OTPOut, OTPWithSecretOut

__all__ = ('router',)

router = APIRouter(prefix='/api/v1/settings/otp', tags=['v1', 'settings', 'otp'])


@router.get('')
async def get_otp(
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[OTPOut]:
    curr_user = current_employee()
    created = await session.scalar(
        sa.select(m.EmployeeOTP.created).where(
            m.EmployeeOTP.employee_id == curr_user.id
        )
    )
    if not created:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='OTP not found')
    return make_success_output(payload=OTPOut(created=created))


@router.get('/secret')
async def get_otp_with_secret(
    otp_header: str | None = Header(alias='X-OTP-Code'),
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[OTPWithSecretOut]:
    if not otp_header:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, detail='no OTP header')
    curr_user = current_employee()
    obj = await session.scalar(
        sa.select(m.EmployeeOTP).where(m.EmployeeOTP.employee_id == curr_user.id)
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='OTP not found')
    if not obj.get_verifier().verify(otp_header, window=1):
        raise HTTPException(
            HTTPStatus.UNAUTHORIZED,
            detail='wrong code in the OTP header',
        )
    return make_success_output(payload=OTPWithSecretOut.from_obj(obj))


@router.post('')
async def create_otp(
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[OTPWithSecretOut]:
    curr_user = current_employee()
    obj = m.EmployeeOTP(
        employee_id=curr_user.id,
        secret=generate_random_base32_secret(),
    )
    session.add(obj)
    try:
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(
            HTTPStatus.CONFLICT, detail='you already have an OTP'
        ) from err
    return make_success_output(payload=OTPWithSecretOut.from_obj(obj))


@router.delete('')
async def remove_otp(
    session: AsyncSession = Depends(get_db_session),
) -> SuccessOutput:
    curr_user = current_employee()
    obj = await session.scalar(
        sa.select(m.EmployeeOTP).where(m.EmployeeOTP.employee_id == curr_user.id)
    )
    if not obj:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='OTP not found')
    await session.delete(obj)
    await session.commit()
    return SuccessOutput()
