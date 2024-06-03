import time
from dataclasses import dataclass
from hashlib import sha1
from http import HTTPStatus
from typing import cast

import jwt
from fastapi import HTTPException, Request

from wb.config import API_KEYS
from wb.constants import API_KEY_TOKEN_MAX_AGE

__all__ = (
    'ServiceUser',
    'is_service_user_jwt',
    'get_service_user',
)


@dataclass
class ServiceUser:
    roles: set[str]


def is_service_user_jwt(s: str) -> bool:
    try:
        headers = jwt.get_unverified_header(s)
        return cast(bool, headers.get('typ') == 'JWT')
    except jwt.DecodeError:
        return False


def verify_service_user_jwt(token: str, request: Request) -> str:
    # pylint: disable=too-many-branches
    try:
        headers = jwt.get_unverified_header(token)
    except jwt.DecodeError as err:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid token') from err
    if not (kid := headers.get('kid')):
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'kid header is required')
    if not (key := API_KEYS.get(kid)):
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid token')
    if request.url.path not in key.paths:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid path')
    if request.method not in key.paths[request.url.path]:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid method')
    try:
        data = jwt.decode(token, key.secret, algorithms=['HS256'])
    except jwt.exceptions.ExpiredSignatureError as err:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Token expired') from err
    except jwt.exceptions.InvalidTokenError as err:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid token') from err
    if 'exp' not in data:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'exp claim is required')
    if 'iat' not in data:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'iat claim is required')
    if 'req_hash' not in data:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'req_hash claim is required')
    url_path = request.url.path + ('?' + request.url.query if request.url.query else '')
    real_req_hash = sha1(
        (request.method + url_path).encode('utf-8'), usedforsecurity=False
    ).hexdigest()
    if data['req_hash'] != real_req_hash:
        raise HTTPException(
            HTTPStatus.UNAUTHORIZED,
            'Invalid request',
        )
    if data['iat'] > time.time():
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Invalid iat claim')
    if data['exp'] - data['iat'] > API_KEY_TOKEN_MAX_AGE:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Token ttl is too long')

    return cast(str, kid)


def get_service_user(token: str, request: Request) -> ServiceUser:
    kid = verify_service_user_jwt(token, request)
    return ServiceUser(roles=API_KEYS[kid].roles)
