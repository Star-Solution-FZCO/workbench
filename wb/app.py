import os

import sentry_sdk
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from starlette.requests import Request
from starlette.responses import JSONResponse
from starsol_fastapi_jwt_auth import AuthJWT
from starsol_fastapi_jwt_auth.exceptions import AuthJWTException

from wb.config import CONFIG, STORAGE_DIR
from wb.utils.current_user import current_user_context_dependency

VERSION = os.environ.get('APP_VERSION', '__DEV__')

if CONFIG.SENTRY_DSN:
    sentry_sdk.init(
        dsn=CONFIG.SENTRY_DSN,
        release=f'{CONFIG.SENTRY_PROJECT_SLUG}@{VERSION}',
        environment=CONFIG.SENTRY_ENVIRONMENT,
        integrations=[
            StarletteIntegration(),
            FastApiIntegration(),
        ],
        traces_sample_rate=1.0,
        ca_certs=CONFIG.CA_CERTS,
    )

app = FastAPI(title='Workbench', version=VERSION, debug=CONFIG.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CONFIG.ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
app.mount('/storage', StaticFiles(directory=STORAGE_DIR), name='static')

instrumentator = Instrumentator(
    should_group_status_codes=False,
    should_group_untemplated=True,
).instrument(app)


@app.on_event('startup')
async def app_init() -> None:
    import wb.utils.audit  # pylint: disable=import-outside-toplevel,unused-import

    instrumentator.expose(app=app)


@AuthJWT.load_config
def get_config() -> 'BaseModel':
    class Settings(BaseModel):
        authjwt_secret_key: str = CONFIG.JWT_SECRET
        authjwt_token_location: set = {'headers', 'cookies'}
        authjwt_cookie_secure: bool = not CONFIG.DEV_MODE
        authjwt_refresh_cookie_path: str = '/api/auth/refresh'
        authjwt_cookie_samesite: str = 'none' if CONFIG.DEV_MODE else 'strict'
        authjwt_cookie_csrf_protect: bool = not CONFIG.DEV_MODE

    return Settings()


@app.exception_handler(AuthJWTException)
def authjwt_exception_handler(_: Request, exc: AuthJWTException) -> JSONResponse:
    # noinspection PyUnresolvedReferences
    return JSONResponse(
        status_code=401,
        content={'success': False, 'detail': exc.message, 'type': 'token_expired'},
    )


# pylint: disable=wrong-import-position
from wb.routes.auth import router as authRouter  # noqa
from wb.routes.avatar import router as avatar_router  # noqa
from wb.routes.legacy import __routers__ as legacy_routers  # noqa
from wb.routes.oauth.router import router as oauth_router  # noqa
from wb.routes.protected import __routers__ as protected_routers  # noqa
from wb.routes.public import router as public_router  # noqa
from wb.routes.v1 import __routers__  # noqa

app.include_router(authRouter)
app.include_router(avatar_router)
app.include_router(public_router)
app.include_router(oauth_router)
for router in __routers__:
    app.include_router(router, dependencies=[Depends(current_user_context_dependency)])
for router in legacy_routers:
    app.include_router(router)
for router in protected_routers:
    app.include_router(router, include_in_schema=False)
