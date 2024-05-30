from wb.config import CONFIG

__routers__ = ()

if CONFIG.YOUTRACK_URL:
    from .portal import portal_router
    from .request import request_router
    from .router import router as help_center_router
    from .service import service_router

    __routers__ = (help_center_router, portal_router, service_router, request_router)
