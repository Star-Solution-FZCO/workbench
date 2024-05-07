# pylint: disable=unused-argument
import pickle
import typing as t
from dataclasses import dataclass
from datetime import datetime

import sqlalchemy as sa
from aioauth.errors import InvalidClientError, InvalidGrantError
from aioauth.models import AuthorizationCode, Client, Token
from aioauth.requests import Request
from aioauth.storage import BaseStorage
from aioauth.types import CodeChallengeMethod, ResponseType
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.redis_db import AsyncRedis

from .config import JWK_PRIVATE_KEY, settings
from .utils import encode_jwt, gen_jwt

if t.TYPE_CHECKING:
    from aioauth.types import TokenType

__all__ = (
    'User',
    'UserAnonymous',
    'Storage',
)


@dataclass
class User:
    email: str

    @classmethod
    def from_employee(cls, emp: m.Employee | None) -> t.Self | None:
        if emp is None:
            return None
        return cls(
            email=emp.email,
        )

    @property
    def is_authenticated(self) -> bool:
        return True


class UserAnonymous:
    @property
    def is_authenticated(self) -> bool:
        return False


class Storage(BaseStorage):  # pylint: disable=abstract-method
    session: AsyncSession
    redis: AsyncRedis

    def __init__(self, session: AsyncSession, redis: AsyncRedis) -> None:
        self.session = session
        self.redis = redis

    async def create_token(
        self,
        request: Request,
        client_id: str,
        scope: str,
        access_token: str,
        refresh_token: str,
    ) -> Token:
        if request.post.grant_type != m.OAuthGrantType.AUTHORIZATION_CODE:
            raise InvalidGrantError(request)
        auth_code = await self.get_authorization_code(
            request, request.post.client_id, request.post.code
        )
        if not auth_code:
            raise InvalidClientError(request)
        emp: m.Employee | None = await self.session.scalar(
            sa.select(m.Employee).where(m.Employee.email == auth_code.user.email)
        )
        if not emp:
            raise InvalidClientError(request)
        _access_token, _refresh_token = gen_jwt(emp)
        token = Token(
            access_token=_access_token,
            client_id=client_id,
            expires_in=settings.TOKEN_EXPIRES_IN,
            issued_at=int(datetime.now().timestamp()),
            refresh_token=_refresh_token,
            refresh_token_expires_in=settings.REFRESH_TOKEN_EXPIRES_IN,
            revoked=False,
            scope=scope,
            token_type='Bearer',  # nosec hardcoded_password_funcarg
            user=request.user,
        )
        return token

    async def revoke_token(
        self,
        request: Request,
        token_type: 'TokenType | None' = 'refresh_token',
        access_token: str | None = None,
        refresh_token: str | None = None,
    ) -> None:
        pass

    async def get_token(
        self,
        request: Request,
        client_id: str,
        token_type: str | None = 'refresh_token',
        access_token: str | None = None,
        refresh_token: str | None = None,
    ) -> Token | None:
        return None

    async def create_authorization_code(
        self,
        request: Request,
        client_id: str,
        scope: str,
        response_type: ResponseType,
        redirect_uri: str,
        code_challenge_method: CodeChallengeMethod | None,
        code_challenge: str | None,
        code: str,
        **kwargs: t.Any,
    ) -> AuthorizationCode:
        if not request.user:
            raise InvalidClientError(request)
        emp: m.Employee | None = await self.session.scalar(
            sa.select(m.Employee).where(m.Employee.email == request.user.email)
        )
        if not emp:
            raise InvalidClientError(request)
        authorization_code = AuthorizationCode(
            auth_time=int(datetime.now().timestamp()),
            client_id=client_id,
            code=code,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method,
            expires_in=settings.AUTHORIZATION_CODE_EXPIRES_IN,
            redirect_uri=redirect_uri,
            response_type=response_type,
            scope=scope,
            user=request.user,
            **kwargs,
        )
        await self.redis.set(f'oauth-code-{code}', pickle.dumps(authorization_code))
        return authorization_code

    async def get_client(
        self, request: Request, client_id: str, client_secret: str | None = None
    ) -> Client | None:
        client_record: m.OAuthClient | None = await self.session.scalar(
            sa.select(m.OAuthClient).where(m.OAuthClient.client_id == client_id)
        )
        if not client_record:
            return None
        return Client(
            client_id=client_record.client_id,
            client_secret=client_record.client_secret,
            grant_types=client_record.grant_types,  # type: ignore
            response_types=client_record.response_types,  # type: ignore
            redirect_uris=client_record.redirect_uris,
            scope=client_record.scope,
        )

    async def get_authorization_code(
        self, request: Request, client_id: str, code: str
    ) -> AuthorizationCode | None:
        if not (cached_auth_code := await self.redis.get(f'oauth-code-{code}')):
            return None
        auth_code_record: AuthorizationCode = pickle.loads(cached_auth_code)
        return auth_code_record

    async def delete_authorization_code(
        self, request: Request, client_id: str, code: str
    ) -> None:
        await self.redis.delete(f'oauth-code-{code}')

    async def get_id_token(
        self,
        request: Request,
        client_id: str,
        scope: str,
        response_type: ResponseType,
        redirect_uri: str,
        **kwargs: t.Any,
    ) -> str:
        if not request.user:
            raise InvalidClientError(request)
        return encode_jwt(
            expires_delta=settings.TOKEN_EXPIRES_IN,
            sub=request.user.email,
            secret=JWK_PRIVATE_KEY,
            additional_claims={
                'aud': client_id,
                **kwargs,
            },
        )
