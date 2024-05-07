from http import HTTPStatus

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from wb.utils.service_user import get_service_user

__all__ = ('protected_auth_dependency',)


token_auth_scheme = HTTPBearer()


async def _protected_auth_dependency(
    request: Request,
    creds: HTTPAuthorizationCredentials = Depends(token_auth_scheme),
) -> None:
    if not creds:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, 'Token is missing')
    get_service_user(creds.credentials, request)


protected_auth_dependency = Depends(_protected_auth_dependency)
