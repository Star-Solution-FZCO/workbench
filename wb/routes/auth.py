from http import HTTPStatus

import jwt
import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from starsol_fastapi_jwt_auth import AuthJWT

import wb.models as m
from wb.config import CONFIG, AuthModeT
from wb.db import get_db_session
from wb.schemas import SuccessOutput, SuccessPayloadOutput, UserAuth, UserProfile
from wb.services.auth import AuthException, get_auth_func, store_user
from wb.utils.password import validate_password_strength
from wb.utils.query import make_success_output

__all__ = ('router',)


router = APIRouter(prefix='/api/auth', tags=['auth'])


class AuthPayload(BaseModel):
    profile: UserProfile


class RegisterForm(BaseModel):
    register_token: str
    password: str


@router.post('/login')
async def login(
    user_auth: UserAuth,
    auth: AuthJWT = Depends(),
    session: AsyncSession = Depends(get_db_session),
) -> SuccessPayloadOutput[AuthPayload]:
    try:
        auth_fn = get_auth_func()
        user = await auth_fn(user_auth.login, user_auth.password, session)
    except AuthException as err:
        raise HTTPException(
            HTTPStatus.UNAUTHORIZED, detail='Bad login or password'
        ) from err
    await store_user(user, user_auth.password, session=session)
    access_token = auth.create_access_token(
        subject=user.email,
        algorithm='HS256',
        expires_time=CONFIG.ACCESS_TOKEN_EXPIRES,
    )
    refresh_expires = CONFIG.REFRESH_TOKEN_NON_REMEMBER_EXPIRES
    if user_auth.remember:
        refresh_expires = CONFIG.REFRESH_TOKEN_REMEMBER_EXPIRES
    refresh_token = auth.create_refresh_token(
        subject=user.email, algorithm='HS256', expires_time=refresh_expires
    )
    auth.set_access_cookies(access_token, max_age=CONFIG.ACCESS_TOKEN_EXPIRES)
    auth.set_refresh_cookies(refresh_token, max_age=refresh_expires)
    return make_success_output(
        payload=AuthPayload(
            profile=UserProfile(
                id=user.id,
                english_name=user.english_name,
                email=user.email,
                account=user.account,
                photo=user.photo,
                hr=user.is_hr,
                admin=user.is_admin,
                timezone=user.timezone,
                roles=list(user.roles),
            ),
        ),
        metadata=None,
    )


@router.get('/refresh')
async def refresh(auth: AuthJWT = Depends()) -> SuccessOutput:
    auth.jwt_refresh_token_required()
    access_token = auth.create_access_token(
        subject=auth.get_jwt_subject(),
        algorithm='HS256',
        expires_time=CONFIG.ACCESS_TOKEN_EXPIRES,
    )
    auth.set_access_cookies(access_token, max_age=CONFIG.ACCESS_TOKEN_EXPIRES)
    return SuccessOutput()


@router.get('/logout')
async def logout(auth: AuthJWT = Depends()) -> SuccessOutput:
    auth.jwt_required()
    auth.unset_jwt_cookies()
    return SuccessOutput()


@router.post('/register')
async def register(
    form: RegisterForm,
    session: AsyncSession = Depends(get_db_session),
) -> SuccessOutput:
    if CONFIG.AUTH_MODE != AuthModeT.LOCAL:
        raise HTTPException(
            HTTPStatus.NOT_IMPLEMENTED, detail='Registration is not allowed'
        )
    if errors := validate_password_strength(form.password):
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail=errors)
    try:
        data = jwt.decode(form.register_token, CONFIG.JWT_SECRET, algorithms=['HS256'])
    except jwt.PyJWTError as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail='Invalid token') from err
    if not (emp_id := data.get('employee_id')) or not isinstance(emp_id, int):
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail='Invalid token')
    emp = await session.scalar(
        sa.select(m.Employee).where(
            m.Employee.id == emp_id, m.Employee.active.is_(True)
        )
    )
    if not emp:
        raise HTTPException(
            HTTPStatus.NOT_FOUND, detail='Active employee record not found'
        )
    if await session.scalar(sa.select(m.User).where(m.User.username == emp.account)):
        raise HTTPException(HTTPStatus.CONFLICT, detail='User already exists')
    user = m.User(
        username=emp.account,
        password_hash=m.User.hash_password(form.password),
        active=emp.active,
    )
    session.add(user)
    await session.commit()
    return SuccessOutput()
