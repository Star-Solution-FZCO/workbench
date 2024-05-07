from .activity import employee_activity_router
from .router import router as employee_router
from .schedule import employee_schedule_router

__routers__ = (
    employee_router,
    employee_activity_router,
    employee_schedule_router,
)
