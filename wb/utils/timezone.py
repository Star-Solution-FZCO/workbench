import zoneinfo
from functools import lru_cache
from typing import Set

__all__ = ('get_timezones',)


@lru_cache()
def get_timezones() -> Set[str]:
    return zoneinfo.available_timezones()
