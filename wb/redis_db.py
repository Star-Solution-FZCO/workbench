import typing as t

from redis.asyncio import ConnectionPool
from redis.asyncio import Redis as AsyncRedis

from wb.config import CONFIG

__all__ = (
    'get_redis_session',
    'session_maker',
    'multithreading_safe_session_maker',
    'AsyncRedis',
)


pool = ConnectionPool.from_url(CONFIG.REDIS_URL)


def session_maker() -> AsyncRedis:
    return AsyncRedis(connection_pool=pool)


def multithreading_safe_session_maker() -> AsyncRedis:
    return AsyncRedis.from_url(CONFIG.REDIS_URL)


async def get_redis_session() -> t.AsyncGenerator[AsyncRedis, None]:
    async with session_maker() as session:
        yield session
