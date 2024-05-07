import os
from os.path import join as opj

from dynaconf import Dynaconf, Validator

__all__ = (
    'CONFIG',
    'TM_CLIENT_VERSION',
    'TM_CLIENT_DIR',
)


ROOT = os.path.realpath(os.path.join(os.path.dirname(__file__), '..'))
CONFIG = Dynaconf(
    settings_files=[
        opj(ROOT, 'settings-' + os.environ.get('APP_ENV', 'production') + '.toml'),
        opj(ROOT, 'settings.toml'),
    ],
    environments=True,
    load_dotenv=True,
    validators=[
        Validator(
            'TM_DB_URI', default='mysql+aiomysql://test:test@127.0.0.1:3306/workbench'
        ),
        Validator('TM_CLIENT_VERSION', cast=int, required=True),
        Validator('TM_CLIENT_DIR', default='/data/tm'),
    ],
)
CONFIG.configure()

TM_CLIENT_VERSION = CONFIG.TM_CLIENT_VERSION
TM_CLIENT_DIR = CONFIG.TM_CLIENT_DIR
