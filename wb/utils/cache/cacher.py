from collections.abc import Awaitable, Callable
from typing import Any

from redis.asyncio import Redis as AsyncRedis

from .serializers import BaseSerializer

__all__ = (
    'CachedFunction',
    'FlushFunction',
)


class CachedFunction:
    namespace: str
    key_builder: Callable[..., str]
    serializer: BaseSerializer
    ttl: int | None
    session_maker: Callable[[], AsyncRedis]
    _func: Callable[..., Awaitable]

    def __init__(
        self,
        func: Callable[..., Awaitable],
        serializer: BaseSerializer,
        key_builder: Callable[..., str],
        namespace: str,
        session_maker: Callable[[], AsyncRedis],
        ttl: int | None = None,
    ) -> None:
        self._func = func
        self.serializer = serializer
        self.key_builder = key_builder
        self.namespace = namespace
        self.session_maker = session_maker
        self.ttl = ttl

    async def _set(self, key: str, value: Any, session: AsyncRedis) -> None:
        await session.set(key, self.serializer.dumps(value), ex=self.ttl)

    async def _get(self, key: str, session: AsyncRedis) -> Any:
        data = await session.get(key)
        if data is None:
            return None
        return self.serializer.loads(data)

    async def __call__(
        self,
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        key = self.key_builder(self._func, *args, **kwargs)
        async with self.session_maker() as session:
            value = await self._get(key, session)
            if value is None:
                value = await self._func(*args, **kwargs)
                await self._set(key, value, session)
            return value


class FlushFunction:
    namespace: str
    key_builder: Callable[..., str]
    session_maker: Callable[[], AsyncRedis]
    _func: Callable[..., Awaitable]

    def __init__(
        self,
        func: Callable[..., Awaitable],
        namespace: str,
        key_builder: Callable[..., str],
        session_maker: Callable[[], AsyncRedis],
    ) -> None:
        self._func = func
        self.namespace = namespace
        self.key_builder = key_builder
        self.session_maker = session_maker

    async def __call__(self, *args: Any, **kwargs: Any) -> Any:
        key = self.key_builder(self._func, *args, **kwargs)
        async with self.session_maker() as session:
            value = await self._func(*args, **kwargs)
            await session.delete(key)
            return value
