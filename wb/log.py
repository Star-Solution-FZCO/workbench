import logging

from wb.config import CONFIG

__all__ = ('log',)

FORMAT = '[%(asctime)s] [%(levelname)s]: %(message)s'

log = logging.getLogger('WB')
log.setLevel(logging.DEBUG if CONFIG.DEV_MODE else logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter(FORMAT, '%Y-%m-%d %H:%M:%S')
handler.setFormatter(formatter)
log.addHandler(handler)
