from .cooperation_type import router as cooperation_type_router
from .employee_pool import router as employee_pool_router
from .grade import router as grade_router
from .holiday import router as holiday_router
from .organization import router as organization_router
from .position import router as position_router
from .team_tags import router as team_tags_router

__routers__ = (
    grade_router,
    employee_pool_router,
    organization_router,
    position_router,
    holiday_router,
    cooperation_type_router,
    team_tags_router,
)
