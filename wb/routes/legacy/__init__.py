from .atinformer import router as atinformer_router
from .checkmessage import router as checkmessage_router
from .informer import router as informer_router

__routers__ = (
    atinformer_router,
    informer_router,
    checkmessage_router,
)
