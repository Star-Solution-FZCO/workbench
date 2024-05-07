from .api_token import router as api_token_router
from .otp import router as otp_router

__routers__ = (
    otp_router,
    api_token_router,
)
