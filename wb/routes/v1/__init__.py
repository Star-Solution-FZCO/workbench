from .activity import __routers__ as __activity__routers__
from .admin import __routers__ as __admin__routers__
from .catalog import __routers__ as __catalog__routers__
from .changelog import __routers__ as __changelog_router__
from .counteragent import __routers__ as __counteragent__routers__
from .employee import __routers__ as __employee__routers__
from .group import __routers__ as __group__routers__
from .help_center import __routers__ as __help_center__routers__
from .notification import __routers__ as __notification__routers__
from .policy import __routers__ as __policy__routers__
from .profile import router as profile_router
from .quiz import __routers__ as __quiz__routers__
from .report import __routers__ as __report__routers__
from .request import __routers__ as __request__routers__
from .select import router as select_router
from .settings import __routers__ as __settings__routers__
from .team import __routers__ as __team__routers__
from .tm import __routers__ as __tm__routers__
from .upload import router as upload_router
from .useful_links import __routers__ as __useful_link__routers__
from .version import router as version_router

__routers__ = [
    select_router,
    upload_router,
    version_router,
    profile_router,
    *__activity__routers__,
    *__admin__routers__,
    *__catalog__routers__,
    *__changelog_router__,
    *__counteragent__routers__,
    *__employee__routers__,
    *__group__routers__,
    *__help_center__routers__,
    *__notification__routers__,
    *__policy__routers__,
    *__quiz__routers__,
    *__report__routers__,
    *__request__routers__,
    *__settings__routers__,
    *__team__routers__,
    *__tm__routers__,
    *__useful_link__routers__,
]
