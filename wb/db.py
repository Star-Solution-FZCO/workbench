from typing import Any, AsyncGenerator, ClassVar, Dict, Tuple

from sqlalchemy import MetaData
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from sqlalchemy.schema import CreateTable
from sqlalchemy.sql.ddl import DDL

from wb.config import CONFIG

__all__ = (
    'get_db_session',
    'BaseDBModel',
    'BaseMonthPartitionedModel',
    'BaseMonthPartitionMixin',
    'async_session',
    'multithreading_safe_async_session',
)

engine = create_async_engine(
    CONFIG.DB_URI,
    echo=False,
    connect_args={'server_settings': {'jit': 'off'}},
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

multithreading_safe_engine = create_async_engine(
    CONFIG.DB_URI, echo=False, poolclass=NullPool
)
multithreading_safe_async_session = async_sessionmaker(
    multithreading_safe_engine, class_=AsyncSession, expire_on_commit=False
)


class BaseDBModel(DeclarativeBase):
    __abstract__ = True
    metadata = MetaData()


class BaseMonthPartitionMixin:
    __part_keys__: ClassVar = {}

    @classmethod
    def gen_range(cls) -> str:
        month = cls.__part_keys__['month']
        year = cls.__part_keys__['year']
        if month == 12:
            return f"FROM ('{year}-{month:02d}-01') TO ('{year + 1}-01-01')"
        return f"FROM ('{year}-{month:02d}-01') TO ('{year}-{(month + 1):02d}-01')"


class BaseMonthPartitionedModel(BaseDBModel):
    __abstract__ = True
    __part_mixin__: ClassVar
    __partitions__: ClassVar[Dict[str, Tuple[Any, bool]]]
    __parts_table_args__: ClassVar[tuple | None] = None

    @staticmethod
    def _gen_key(month: int, year: int) -> str:
        return f'{year}_{month:02d}'

    @classmethod
    def _create_partition(cls, month: int, year: int) -> Any:
        key = cls._gen_key(month, year)
        if key in cls.__partitions__:
            return cls.__partitions__[key][0]
        partition = type(
            f'{cls.__name__}__part__{key}',
            (cls.__part_mixin__, BaseDBModel),
            {
                '__tablename__': f'{cls.__tablename__}__part__{key}',
                '__table_args__': (
                    *(cls.__parts_table_args__ or ()),
                    {'schema': 'partitions'},
                ),
                '__part_keys__': {'month': month, 'year': year},
            },
        )
        partition.__table__.add_is_dependent_on(cls.__table__)  # type: ignore
        cls.__partitions__[key] = partition, False
        return partition

    @classmethod
    async def create_partition(
        cls, month: int, year: int, session: AsyncSession
    ) -> None:
        key = cls._gen_key(month, year)
        if key in cls.__partitions__ and cls.__partitions__[key][1]:
            return
        part = cls._create_partition(month, year)
        try:
            await session.execute(CreateTable(part.__table__))
            sql = f'ALTER TABLE {cls.__tablename__} ATTACH PARTITION partitions.{part.__tablename__} FOR VALUES {part.gen_range()}'
            await session.execute(DDL(sql))
            await session.commit()
        except ProgrammingError as err:
            if 'DuplicateTableError' not in err.args[0]:
                raise
        cls.__partitions__[key] = part, True


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
