from .employee import router as employee_report_router
from .team import router as team_report_router

__routers__ = (
    employee_report_router,
    team_report_router,
)
