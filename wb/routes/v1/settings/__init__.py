from wb.config import CONFIG, AuthModeT

from .api_token import router as api_router__router
from .otp import router as otp_router

__routers__ = [
    api_router__router,
    otp_router,
]

if CONFIG.AUTH_MODE == AuthModeT.LOCAL:
    from .password import router as password_router

    __routers__.append(password_router)
