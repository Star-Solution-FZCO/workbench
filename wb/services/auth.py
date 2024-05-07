from collections.abc import Callable, Coroutine
from typing import cast

import bonsai
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.config import CONFIG, AuthModeT

__all__ = (
    'get_auth_func',
    'AuthException',
    'store_user',
)


class AuthException(Exception):
    detail: str

    def __init__(self, detail: str) -> None:
        super().__init__()
        self.detail = detail


def ldap_username(username: str) -> str:
    if '@' in username:
        return username
    return f'{username}@{CONFIG.LDAP_USER_DEFAULT_DOMAIN}'


def _verify_whoami(whoami: str, username: str) -> None:
    whoami = whoami.lower()
    user, domain_full = username.lower().split('@', maxsplit=1)
    domain = domain_full.split('.', maxsplit=1)[0]
    if not whoami == f'u:{domain}\\{user}':
        raise AuthException(detail='Failed to auth ldap user')


async def _get_user_by_login(
    login: str,
    session: AsyncSession,
) -> m.Employee:
    q = sa.select(m.Employee).where(m.Employee.active.is_(True))
    login_value = str.strip(login).lower()
    if login_value.endswith(CONFIG.LDAP_USER_DEFAULT_DOMAIN.lower()):
        login_value = login_value.split('@', maxsplit=1)[0]
    if '@' in login_value:
        q = q.filter(m.Employee.email == login_value)
    else:
        q = q.filter(m.Employee.account == login_value)
    result = await session.execute(q)
    if not (user := result.scalar_one_or_none()):
        raise AuthException('User not found')
    return cast(m.Employee, user)


async def ldap_auth(
    login: str,
    password: str,
    session: AsyncSession,
) -> m.Employee:
    if not password:
        raise AuthException(detail='Password is empty')
    user = await _get_user_by_login(login, session=session)
    _ldap_username = ldap_username(user.account)
    client = bonsai.LDAPClient(CONFIG.LDAP_URI)
    client.set_credentials('SIMPLE', user=_ldap_username, password=password)
    try:
        async with client.connect(is_async=True) as conn:
            _verify_whoami(await conn.whoami(), _ldap_username)
    except bonsai.errors.AuthenticationError as err:
        raise AuthException(detail='Failed to auth ldap user') from err
    return user


async def dev_auth(
    login: str,
    password: str,
    session: AsyncSession,
) -> m.Employee:
    user = await _get_user_by_login(login, session=session)
    if not CONFIG.DEV_PASSWORD:
        raise AuthException(detail='Dev password is empty')
    if password != CONFIG.DEV_PASSWORD:
        raise AuthException(detail='Wrong dev password')
    return user


async def local_auth(
    login: str,
    password: str,
    session: AsyncSession,
) -> m.Employee:
    if not password:
        raise AuthException(detail='Password is empty')
    if not (
        user := await session.scalar(
            sa.select(m.User).where(
                sa.and_(
                    m.User.username == login,
                    m.User.active.is_(True),
                )
            )
        )
    ):
        raise AuthException(detail='User not found')
    if not user.check_password(password):
        raise AuthException(detail='Wrong user or password')
    if not (
        emp := await session.scalar(
            sa.select(m.Employee).where(
                sa.and_(
                    m.Employee.account == user.username, m.Employee.active.is_(True)
                )
            )
        )
    ):
        raise AuthException(detail='User not found')
    return emp


async def store_user(
    emp: m.Employee,
    password: str,
    session: AsyncSession,
) -> None:
    if not (
        user := await session.scalar(
            sa.select(m.User).where(m.User.username == emp.account)
        )
    ):
        user = m.User(
            username=emp.account,
            password_hash=m.User.hash_password(password),
            active=emp.active,
        )
        session.add(user)
    else:
        if not user.check_password(password):
            user.set_password(password)
    await session.commit()


def get_auth_func() -> (
    Callable[[str, str, AsyncSession], Coroutine[None, None, m.Employee]]
):
    if CONFIG.AUTH_MODE == AuthModeT.DEV:
        return dev_auth
    if CONFIG.AUTH_MODE == AuthModeT.LOCAL:
        return local_auth
    if CONFIG.AUTH_MODE == AuthModeT.LDAP:
        return ldap_auth
    raise ValueError('Unknown auth mode')
