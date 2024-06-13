import datetime
import os
import re
from dataclasses import dataclass, field
from enum import StrEnum
from os.path import join as opj
from typing import Any

from dynaconf import Dynaconf, Validator

__all__ = (
    'CONFIG',
    'API_KEYS',
    'AuthModeT',
)


@dataclass
class APIKeyT:
    kid: str
    name: str
    secret: str
    paths: dict[str, list[str]]
    roles: set[str]
    __paths_patterns__: list[tuple[re.Pattern, list[str]]] = field(init=False)

    def __post_init__(self) -> None:
        self.__paths_patterns__ = [
            (re.compile(f'^{p}$'), methods) for p, methods in self.paths.items()
        ]

    def check_path(self, path: str, method: str) -> bool:
        return any(
            pattern.fullmatch(path) and method in methods
            for pattern, methods in self.__paths_patterns__
        )


def parse_api_keys(keys: dict[str, Any]) -> dict[str, APIKeyT]:
    result = {
        kid: APIKeyT(
            kid=kid,
            name=data['name'],
            secret=data['secret'],
            paths={p['path']: p.get('methods', ['GET']) for p in data['paths']},
            roles=set(data.get('roles', [])),
        )
        for kid, data in keys.items()
    }
    if len(result) != len(keys):
        raise ValueError('Duplicate key ids')
    return result


class AuthModeT(StrEnum):
    DEV = 'dev'
    LOCAL = 'local'
    LDAP = 'ldap'


ROOT = os.path.realpath(os.path.join(os.path.dirname(__file__), '..'))
CONFIG = Dynaconf(
    settings_files=[
        opj(ROOT, 'settings-' + os.environ.get('APP_ENV', 'production') + '.toml'),
        opj(ROOT, 'settings.toml'),
    ],
    environments=True,
    load_dotenv=True,
    validators=[
        Validator('AUTH_MODE', cast=AuthModeT, default=AuthModeT.LDAP),
        Validator('DEV_MODE', cast=bool, default=False),
        Validator('DEV_PASSWORD', default=None),  # works only in dev mode
        Validator('SEND_NOTIFICATION_TO_CONSOLE', cast=bool, default=False),
        Validator('DEBUG', cast=bool, default=False),
        Validator('PUBLIC_BASE_URL', default='http://localhost:3000'),
        Validator('JWT_SECRET', required=True),
        Validator('SENTRY_DSN', default=''),
        Validator('SENTRY_PROJECT_SLUG', default='wb-backend'),
        Validator('SENTRY_ENVIRONMENT', default='test'),
        Validator(
            'ORIGINS',
            default=[
                'http://localhost',
                'http://localhost.localdomain',
                'http://localhost:9090',
                'http://localhost.localdomain:9090',
            ],
        ),
        Validator('DB_URI', default='postgresql+asyncpg://me:me@127.0.0.1:5432/me'),
        Validator('DB_ENCRYPT_KEY', required=True),
        Validator(
            'LDAP_URI',
            is_type_of=str,
            must_exist=True,
            when=Validator('AUTH_MODE', condition=lambda v: v == AuthModeT.LDAP),
        ),
        Validator(
            'LDAP_USER_DEFAULT_DOMAIN',
            is_type_of=str,
            default='',
        ),
        Validator(
            'REFRESH_TOKEN_NON_REMEMBER_EXPIRES',
            cast=int,
            default=int(datetime.timedelta(hours=2).total_seconds()),
        ),
        Validator(
            'REFRESH_TOKEN_REMEMBER_EXPIRES',
            cast=int,
            default=int(datetime.timedelta(days=90).total_seconds()),
        ),
        Validator(
            'ACCESS_TOKEN_EXPIRES',
            cast=int,
            default=int(datetime.timedelta(minutes=15).total_seconds()),
        ),
        Validator('CA_CERTS', default=''),
        Validator('BBOT_API_URL', 'BBOT_API_TOKEN', cast=str),
        Validator('CELERY_BROKER_URL', cast=str, default='redis://localhost:6379'),
        Validator('REDIS_URL', cast=str, default='redis://localhost:6379'),
        Validator('YOUTRACK_URL', is_type_of=str, default=''),
        Validator(
            'YOUTRACK_API_TOKEN',
            must_exist=True,
            is_type_of=str,
            when=Validator('YOUTRACK_URL', condition=bool),
        ),
        Validator(
            'YOUTRACK_SCOPE',
            is_type_of=str,
            must_exist=True,
            when=Validator('YOUTRACK_URL', condition=bool),
        ),
        Validator(
            'YOUTRACK_USER_TOKEN_PREFIX',
            is_type_of=str,
            default='wb-help-center-access',
            when=Validator('YOUTRACK_URL', condition=bool),
        ),
        Validator(
            'S3_ACCESS_KEY',
            'S3_SECRET_KEY',
            'S3_ENDPOINT',
            'S3_BUCKET',
            'S3_REGION',
            'S3_VERIFY',
            cast=str,
        ),
        Validator('SMTP_HOST', cast=str, default='localhost'),
        Validator('SMTP_SENDER', cast=str, default='wb@localhost'),
        Validator('SMTP_LOGIN', 'SMTP_PASSWORD', cast=str, default=''),
        Validator('SMTP_SSL_MODE', cast=str, default=''),
        Validator('SMTP_PORT', cast=int, default=25),
        Validator('NOTIFICATION_PEOPLE_PROJECT_EMAIL', cast=str, default=''),
        Validator(
            'ACTIVITY_REPORTS_EMAIL', cast=str, default='activity@localhost.localdomain'
        ),
        Validator('PRESENCE_BOT_PARARAM_KEY', cast=str, default=''),
        Validator('CONFLUENCE_URL', is_type_of=str, default=''),
        Validator(
            'CONFLUENCE_API_TOKEN',
            is_type_of=str,
            must_exist=True,
            when=Validator('CONFLUENCE_URL', condition=bool),
        ),
        Validator(
            'CONFLUENCE_OFFBOARD_ARTICLE_PAGE_ID',
            is_type_of=str,
            default='',
            when=Validator('CONFLUENCE_URL', condition=bool),
        ),
        Validator('EMAIL_DOMAIN_WHITELIST', default=['localhost']),
        Validator('OAUTH_JWK_PRIVATE_KEY', default='etc/oauth/jwk.key'),
        Validator('OAUTH_JWK_PUBLIC_CERT', default='etc/oauth/jwk.crt'),
        Validator('OTP_DIGITS', cast=int, default=6),
        Validator('OTP_PERIOD', cast=int, default=30),
        Validator('OTP_DIGEST', cast=str, default='sha1'),
        Validator('OTP_ISSUER', default='wb'),
        Validator('api_keys', default={}),
        Validator('WIKI_GRADES_URL', default=''),
        Validator('CREDENTIALS_SERVICE_URL', cast=str, default='http://localhost:3002'),
        Validator(
            'CREDENTIALS_SERVICE_CERT_PATH',
            cast=str,
            default='etc/credentials/cm-auth.pem',
        ),
        Validator('CALDAV_URL', is_type_of=str, default=''),
        Validator(
            'CALDAV_USERNAME',
            is_type_of=str,
            must_exist=True,
            when=Validator('CALDAV_URL', condition=bool),
        ),
        Validator(
            'CALDAV_PASSWORD',
            is_type_of=str,
            must_exist=True,
            when=Validator('CALDAV_URL', condition=bool),
        ),
        Validator('TM_CLIENT_ENABLE', cast=bool, default=True),
        Validator(
            'TM_CLIENT_VERSION',
            cast=int,
            must_exist=True,
            when=Validator('TM_CLIENT_ENABLE', condition=bool),
        ),
        Validator(
            'TM_CLIENT_DIR',
            default='/data/tm',
            when=Validator('TM_CLIENT_ENABLE', condition=bool),
        ),
        Validator('PASSWORD_MIN_LENGTH', cast=int, default=11),
    ],
)
CONFIG.configure()
API_KEYS = parse_api_keys(CONFIG.api_keys)

if CONFIG.DEV_MODE:
    CONFIG.SEND_NOTIFICATION_TO_CONSOLE = True
    # For development purposes, we allow to use dev mode only with dev or local auth mode
    CONFIG.AUTH_MODE = (
        AuthModeT.DEV
        if CONFIG.AUTH_MODE not in (AuthModeT.DEV, AuthModeT.LOCAL)
        else CONFIG.AUTH_MODE
    )
