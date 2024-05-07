from .import_csv import router as admin_import_router  # type: ignore[attr-defined]
from .oauth import router as admin_oauth_router

__routers__ = (
    admin_import_router,
    admin_oauth_router,
)
