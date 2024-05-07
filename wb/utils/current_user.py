from collections.abc import AsyncGenerator
from http import HTTPStatus
from typing import cast

import sqlalchemy as sa
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from starlette_context import context, request_cycle_context
from starsol_fastapi_jwt_auth import AuthJWT

import wb.models as m
from wb.db import get_db_session

from .service_user import ServiceUser, get_service_user, is_service_user_jwt

__all__ = (
    'current_user_context_dependency',
    'current_user_dependency',
    'current_user',
    'current_employee',
    'get_current_roles_employee_related',
)

bearer_scheme = HTTPBearer(auto_error=False)


def get_bearer_token(
    authorization: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str | None:
    if not authorization:
        return None
    return cast(str, authorization.credentials)


async def get_employee_by_bearer_token(
    token: str, session: AsyncSession
) -> m.Employee | None:
    try:
        emp_id = m.APIToken.get_owner_id_from_token(token)
    except m.APITokenParseException:
        return None
    tokens_raw = await session.scalars(
        sa.select(m.APIToken)
        .where(m.APIToken.owner_id == emp_id)
        .options(selectinload(m.APIToken.owner))
    )
    for obj in tokens_raw.all():
        if not obj.is_expired and obj.token == token:
            return cast(m.Employee, obj.owner)
    return None


async def current_user_dependency(
    request: Request,
    jwt_auth: AuthJWT = Depends(AuthJWT),
    bearer_token: str | None = Depends(get_bearer_token),
    session: AsyncSession = Depends(get_db_session),
) -> 'm.Employee | ServiceUser':
    if bearer_token and is_service_user_jwt(bearer_token):
        return get_service_user(bearer_token, request)
    if bearer_token:
        user = await get_employee_by_bearer_token(bearer_token, session=session)
    else:
        jwt_auth.jwt_required()
        user_login = jwt_auth.get_jwt_subject()
        result = await session.execute(
            sa.select(m.Employee).where(m.Employee.email == user_login)
        )
        user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            HTTPStatus.UNAUTHORIZED, 'Authorized user could not be found'
        )
    if not user.active:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'User is disabled')
    return user


async def current_user_context_dependency(
    user: 'm.Employee | ServiceUser' = Depends(current_user_dependency),
) -> AsyncGenerator:
    data = {'current_user': user}
    with request_cycle_context(data):
        yield


def current_employee() -> m.Employee:
    user = current_user()
    if isinstance(user, m.Employee):
        return user
    raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Authorized user is not an employee')


def current_user() -> m.Employee | ServiceUser:
    if user := context.get('current_user'):
        return cast('m.Employee | ServiceUser', user)
    raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Authorized user could not be found')


def get_current_roles_employee_related(user: m.Employee | None = None) -> set[str]:
    curr_user = current_user()
    roles = set(curr_user.roles)
    if isinstance(curr_user, ServiceUser):
        return roles
    if not user:
        return roles
    if user.id == curr_user.id:
        roles.add('self')
    if user.team and user.team.manager_id == curr_user.id:
        roles.add('team_lead')
    if user.managers and curr_user.id in [man.id for man in user.managers]:
        roles.add('manager')
    return roles
