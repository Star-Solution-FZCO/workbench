from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING
from uuid import uuid4

from jose import constants, jwt

from wb.config import CONFIG

from .config import JWK_PRIVATE_KEY, settings

if TYPE_CHECKING:
    from wb.models import Employee

__all__ = (
    'encode_jwt',
    'gen_jwt',
)


def encode_jwt(
    expires_delta: int,
    sub: str,
    secret: bytes | str,
    additional_claims: dict | None = None,
    algorithm: str = constants.ALGORITHMS.RS256,
) -> str:
    now = datetime.now(timezone.utc)
    if additional_claims is None:
        additional_claims = {}
    claims = {
        'iss': CONFIG.PUBLIC_BASE_URL,
        'iat': now,
        'jti': str(uuid4()),
        'nbf': now,
        'sub': sub,
        'exp': now + timedelta(seconds=expires_delta),
        **additional_claims,
    }

    return jwt.encode(
        claims,
        secret,
        algorithm,
    )


def gen_jwt(emp: 'Employee') -> tuple[str, str]:
    access_token = encode_jwt(
        sub=emp.email,
        secret=JWK_PRIVATE_KEY,
        expires_delta=settings.TOKEN_EXPIRES_IN,
        additional_claims={
            'token_type': 'access',
        },
    )

    refresh_token = encode_jwt(
        sub=emp.email,
        secret=JWK_PRIVATE_KEY,
        expires_delta=settings.TOKEN_EXPIRES_IN,
        additional_claims={
            'token_type': 'refresh',
        },
    )

    return access_token, refresh_token
