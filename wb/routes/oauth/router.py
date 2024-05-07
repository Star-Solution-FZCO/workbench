import json
import os
from dataclasses import dataclass
from http import HTTPStatus
from typing import Any

from aioauth.requests import Query
from aioauth.requests import Request as OAuth2Request
from aioauth.server import AuthorizationServer
from aioauth_fastapi.forms import TokenForm
from aioauth_fastapi.utils import to_fastapi_response, to_oauth2_request
from fastapi import APIRouter, Depends, Form, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.ext.asyncio import AsyncSession
from starsol_fastapi_jwt_auth import AuthJWT

from wb.config import CONFIG
from wb.db import get_db_session
from wb.redis_db import AsyncRedis, get_redis_session
from wb.services.auth import AuthException, get_auth_func

from .config import GRANT_TYPES, JWS_DATA, settings
from .storage import Storage, User, UserAnonymous

__all__ = ('router',)


router = APIRouter(prefix='/oauth')


jinja_env = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates'))
)


@dataclass
class UserAuthForm:
    login: str = Form()
    password: str = Form()
    remember: bool = Form(default=False)


@router.post('/token')
async def token(
    request: Request,
    form: TokenForm = Depends(),  # pylint: disable=unused-argument
    session: AsyncSession = Depends(get_db_session),
    redis: AsyncRedis = Depends(get_redis_session),
) -> Response:
    request.scope['user'] = UserAnonymous()
    storage = Storage(session, redis)
    auth_server: AuthorizationServer = AuthorizationServer(
        storage, grant_types=GRANT_TYPES
    )
    oauth2_request: OAuth2Request = await to_oauth2_request(request, settings)
    oauth2_response = await auth_server.create_token_response(oauth2_request)
    response: Response = await to_fastapi_response(oauth2_response)
    return response


@router.get('/authorize')
async def authorize(
    request: Request,
    query: Query = Depends(),  # pylint: disable=unused-argument
    auth: AuthJWT = Depends(),
    session: AsyncSession = Depends(get_db_session),
    redis: AsyncRedis = Depends(get_redis_session),
) -> Response:
    auth.jwt_optional()
    if not (jwt_user_subject := auth.get_jwt_subject()):
        return RedirectResponse(url=f'/oauth/login?{request.query_params}')
    request.scope['user'] = User(email=jwt_user_subject)
    storage = Storage(session, redis)
    auth_server: AuthorizationServer = AuthorizationServer(
        storage, grant_types=GRANT_TYPES
    )
    oauth2_request: OAuth2Request = await to_oauth2_request(request, settings)
    oauth2_response = await auth_server.create_authorization_response(oauth2_request)
    response: Response = await to_fastapi_response(oauth2_response)
    return response


@router.get('/.well-known/openid-configuration')
async def openid_discovery() -> Any:
    jinja_template = jinja_env.get_template('openid-configuration.json.jinja2')
    return json.loads(jinja_template.render(public_url=CONFIG.PUBLIC_BASE_URL))


@router.get('/jwks')
async def get_jwks() -> Any:
    jinja_template = jinja_env.get_template('jwks.json.jinja2')
    return json.loads(
        jinja_template.render(
            jws_data=JWS_DATA,
        )
    )


@router.get('/login')
async def get_login_page() -> HTMLResponse:
    jinja_template = jinja_env.get_template('login.html.jinja2')
    return HTMLResponse(content=jinja_template.render())


@router.post('/login')
async def login_process(
    request: Request,
    data: UserAuthForm = Depends(),
    auth: AuthJWT = Depends(),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    jinja_template = jinja_env.get_template('login.html.jinja2')
    try:
        auth_fn = get_auth_func()
        user = await auth_fn(data.login, data.password, session)
    except AuthException:
        return HTMLResponse(
            content=jinja_template.render(error='Bad login or password')
        )
    access_token = auth.create_access_token(
        subject=user.email,
        algorithm='HS256',
        expires_time=CONFIG.ACCESS_TOKEN_EXPIRES,
    )
    refresh_expires = CONFIG.REFRESH_TOKEN_NON_REMEMBER_EXPIRES
    if data.remember:
        refresh_expires = CONFIG.REFRESH_TOKEN_REMEMBER_EXPIRES
    refresh_token = auth.create_refresh_token(
        subject=user.email, algorithm='HS256', expires_time=refresh_expires
    )
    response = RedirectResponse(
        status_code=HTTPStatus.FOUND,
        url=f'/oauth/authorize?{request.query_params}',
    )
    auth.set_access_cookies(
        access_token, response=response, max_age=CONFIG.ACCESS_TOKEN_EXPIRES
    )
    auth.set_refresh_cookies(refresh_token, response=response, max_age=refresh_expires)
    return response
