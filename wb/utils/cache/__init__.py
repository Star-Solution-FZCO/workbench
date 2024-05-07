import functools
import inspect
import os
from collections.abc import Awaitable, Callable, Container
from typing import TYPE_CHECKING, Any

from wb.redis_db import multithreading_safe_session_maker, session_maker

from .cacher import CachedFunction, FlushFunction
from .serializers import PickleSerializer

if TYPE_CHECKING:
    from redis.asyncio import Redis as AsyncRedis

__all__ = (
    'lru_cache',
    'flush_cache',
    'get_key_builder_exclude_args',
)

CACHE_NAMESPACE = '_lru-cache'


def _choose_session_maker() -> Callable[[], 'AsyncRedis']:
    """
    Choose the appropriate session maker for the current thread.

    :return: A session maker.
    :rtype: Callable[[], AsyncRedis]
    """
    if os.getenv('MULTITHREADING_ENABLED', 'False') == 'True':
        return multithreading_safe_session_maker
    return session_maker


def lru_cache(
    ttl: int | None = None,
    key_builder: Callable[..., str] | None = None,
) -> Callable:
    """
    Decorator factory for creating a cached version of an asynchronous function.

    This decorator creates a cache for the decorated asynchronous function using
    the specified time-to-live (TTL) and key builder function. It utilizes a
    Redis cache backend.

    :param ttl: Time-to-live for cache entries in seconds. If None, caching is disabled.
    :type ttl: int or None
    :param key_builder: A callable that generates cache keys from function
                        arguments. If None, a default key builder is used.
    :type key_builder: Callable[..., str] or None

    :return: A decorator that caches the decorated asynchronous function.
    :rtype: Callable

    :Example:

    >>> @lru_cache(ttl=60)
    >>> async def my_async_function(arg1, arg2):
    ...     pass

    """

    def wrapper(func: Callable[..., Awaitable]) -> Callable[..., Awaitable]:
        cached = CachedFunction(
            func=func,
            serializer=PickleSerializer(),
            key_builder=key_builder or key_builder_default,
            namespace=CACHE_NAMESPACE,
            session_maker=_choose_session_maker(),
            ttl=ttl,
        )

        @functools.wraps(func)
        async def inner(*args: Any, **kwargs: Any) -> Any:
            return await cached(*args, **kwargs)

        return inner

    return wrapper


def flush_cache(key_builder: Callable[..., str]) -> Callable:
    """
    A decorator function that wraps a given function with a cache flushing mechanism.
    The cache key is built using the provided key_builder function.

    :param key_builder: A function that builds a cache key.
    :type key_builder: Callable[..., str]
    :return: A wrapper function that wraps the given function with a cache flushing mechanism.
    :rtype: Callable

    :Example:

    >>> def key_builder(f, user_id: int) -> str:
    ...    return f'user-{user_id}'

    >>> @flush_cache(key_builder=key_builder)
    >>> async def set_something(user_id: int):
    ...    pass
    """

    def wrapper(func: Callable[..., Awaitable]) -> Callable[..., Awaitable]:
        flush = FlushFunction(
            func=func,
            key_builder=key_builder,
            namespace=CACHE_NAMESPACE,
            session_maker=_choose_session_maker(),
        )

        @functools.wraps(func)
        async def inner(*args: Any, **kwargs: Any) -> Any:
            return await flush(*args, **kwargs)

        return inner

    return wrapper


def _parse_params(func: Callable, *args: Any, **kwargs: Any) -> dict[str, Any]:
    """
    Parse the parameters passed to a function and return a dictionary of parameter names and their corresponding values.

    :param func: The function to parse the parameters for.
    :type func: Callable
    :param args: Positional arguments passed to the function.
    :type args: Any
    :param kwargs: Keyword arguments passed to the function.
    :type kwargs: Any
    :return: A dictionary containing parameter names as keys and their corresponding values.
    :rtype: dict[str, Any]

    :Example:

    >>> def example_func(a, b, c=3, d=4):
    ...     pass
    ...
    >>> _parse_params(example_func, 1, 2, 6)
    {'a': 1, 'b': 2, 'c': 6, 'd': 4}
    >>> _parse_params(example_func, 1, b=2, d=65)
    {'a': 1, 'b': 2, 'c': 3, 'd': 65}
    """
    signature = inspect.signature(func)
    params = list(signature.parameters.keys())
    vals: dict[str, Any] = {}
    for i, v in enumerate(args):
        vals[params[i]] = v
    for p in params[len(args) :]:
        vals[p] = kwargs[p] if p in kwargs else signature.parameters[p].default
    return vals


def _key_builder(
    func: Callable,
    parsed_params: dict[str, Any],
    func_name: str | None = None,
) -> str:
    """
    Build a key string using the function and parsed parameters.

    :param func: The function for which the key is being built.
    :type func: Callable
    :param parsed_params: The parsed parameters used to build the key.
    :type parsed_params: dict[str, Any]
    :param func_name: The name of the function.
    If None, the function's real name is used in ``<module_name>.<func_name>`` format.
    :type func_name: str or None
    :return: The key string.
    :rtype: str

    :Example:
    >>> def add(a, b):
    ...     return a + b
    >>> parsed_params = {'a': 5, 'b': 10}
    >>> _key_builder(add, parsed_params)
    'module_name.add({\'a\': 5, \'b\': 10})'
    """
    if func_name is None:
        func_name = f'{func.__module__}.{func.__name__}'

    return f'{func_name}({repr(parsed_params)})'


def key_builder_default(func: Callable, *args: Any, **kwargs: Any) -> str:
    """
    Default key builder function.

    :param func: The callable for which the key is to be generated.
    :type func: Callable
    :param args: The positional arguments passed to the callable.
    :type args: Any
    :param kwargs: The keyword arguments passed to the callable.
    :type kwargs: Any
    :return: The string representation of the generated key.
    :rtype: str
    """
    return _key_builder(func, _parse_params(func, *args, **kwargs))


def get_key_builder_exclude_args(
    excluded_args: Container,
    func_name: str | None = None,
) -> Callable[..., str]:
    """
    Return a key builder function that excludes specified arguments.

    :param excluded_args: A container of arguments to be excluded.
    :type excluded_args: Container
    :param func_name: The name of the function.
    If None, the function's real name is used in ``<module_name>.<func_name>`` format.
    :type func_name: str or None
    :return: A key builder function.
    :rtype: Callable[..., str]

    :Example:

    >>> @lru_cache(ttl=60 * 60, key_builder=get_key_builder_exclude_args(('c',)))
    >>> async def my_func(a: int, b: str, c: list[int]) -> None:
    ...     pass
    """

    def key_builder(func: Callable, *args: Any, **kwargs: Any) -> str:
        all_args = _parse_params(func, *args, **kwargs)
        return _key_builder(
            func,
            {k: v for k, v in all_args.items() if k not in excluded_args},
            func_name=func_name,
        )

    return key_builder
