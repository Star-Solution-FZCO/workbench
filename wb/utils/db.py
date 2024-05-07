from collections.abc import Iterable
from typing import TypeVar

import sqlalchemy as sa
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.selectable import Select as SASelect

from wb.models import BaseDBModel

__all__ = (
    'resolve_db_ids',
    'resolve_db_id',
    'resolve_db_ids_to_dict',
    'count_select_query_results',
)

ModelT = TypeVar('ModelT', bound=BaseDBModel)


async def resolve_db_ids(
    model: type[ModelT], ids: Iterable[int], session: AsyncSession
) -> list[ModelT]:
    ids_ = set(ids)
    results = await session.scalars(sa.select(model).where(model.id.in_(ids_)))  # type: ignore[attr-defined]
    objs = results.all()
    if len(objs) != len(ids_):
        raise NoResultFound('not all of ids was resolved successfully')
    return list(objs)


async def resolve_db_id(model: type[ModelT], id_: int, session: AsyncSession) -> ModelT:
    results = await resolve_db_ids(model, [id_], session=session)
    return results[0]


async def resolve_db_ids_to_dict(
    model: type[ModelT], ids: Iterable[int], session: AsyncSession
) -> dict[int, ModelT]:
    raw_results = await resolve_db_ids(model, set(ids), session=session)
    return {obj.id: obj for obj in raw_results}  # type: ignore[attr-defined]


async def count_select_query_results(query: SASelect, session: AsyncSession) -> int:
    count_res = await session.scalar(
        sa.select(sa.func.count()).select_from(  # pylint: disable=not-callable
            query.subquery()
        )
    )
    return count_res or 0
