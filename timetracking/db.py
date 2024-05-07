from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from timetracking.config import CONFIG

__all__ = (
    'get_tm_db_session',
    'TMBaseDBModel',
    'tm_async_session',
    'tm_multithreading_safe_async_session',
)


engine = create_async_engine(
    CONFIG.TM_DB_URI, echo=False, pool_pre_ping=True, pool_recycle=300
)
tm_async_session = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

multithreading_safe_engine = create_async_engine(
    CONFIG.TM_DB_URI, echo=False, poolclass=NullPool
)
tm_multithreading_safe_async_session = async_sessionmaker(
    multithreading_safe_engine, class_=AsyncSession, expire_on_commit=False
)


async def get_tm_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with tm_async_session() as session:
        yield session


class TMBaseDBModel(DeclarativeBase):
    pass
