from .api_token import router as api_router__router
from .otp import router as otp_router

__routers__ = (
    api_router__router,
    otp_router,
)
