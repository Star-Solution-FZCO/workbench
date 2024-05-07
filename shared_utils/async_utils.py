import typing as t
from asyncio import iscoroutinefunction

__all__ = ('to_async',)


def to_async(func: t.Callable | t.Awaitable) -> t.Awaitable:
    """
    Convert a synchronous function to an asynchronous function.

    This function takes a callable object `func` as input and returns an awaitable object.
    If `func` is already an asynchronous function, it is returned as is.
    Otherwise, a wrapper function is created that calls `func` and returns the result.

    Parameters:
        func (callable | awaitable): The synchronous or asynchronous function to be converted.

    Returns:
        awaitable: An awaitable object representing the converted asynchronous function.

    Examples:
        >>> async def async_func():
        ...     return "Hello, World!"
        ...
        >>> await to_async(async_func)()
        'Hello, World!'

        >>> def sync_func():
        ...     return "Hello, World!"
        ...
        >>> await to_async(sync_func)()
        'Hello, World!'
    """
    if iscoroutinefunction(func):
        return func  # type: ignore

    async def wrapper(*args, **kwargs) -> t.Any:  # type: ignore
        return func(*args, **kwargs)  # type: ignore

    return wrapper  # type: ignore
