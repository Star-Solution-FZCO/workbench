import typing as t

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import wb.models as m
from wb.utils.db import count_select_query_results
from wb.utils.search import filter_to_query, sort_to_query


async def list_counteragents_by_team(
    team_id: int, session: AsyncSession
) -> list[m.CounterAgent]:
    query = (
        sa.select(m.CounterAgent)
        .filter(
            m.CounterAgent.team_id == team_id,
            m.CounterAgent.team_required.is_(True),
            m.CounterAgent.group.is_(False),
            m.CounterAgent.status != m.CounterAgentStatus.INVALID,
        )
        .options(
            selectinload(m.CounterAgent.parent), selectinload(m.CounterAgent.agents)
        )
    )
    count = await count_select_query_results(query, session=session)
    results: list[m.CounterAgent] = await session.scalars(query)
    return count, results


async def get_counteragents(
    session: AsyncSession,
    counteagent_filter: str | t.Any | None = None,
    limit: int | None = None,
    offset: int = 0,
    sort_by: str | None = None,
    sort_direction: t.Literal['asc', 'desc'] = 'asc',
    readable_fields: t.Iterable[str] | None = None,
) -> t.Tuple[int, t.Sequence['m.CounterAgent']]:
    q = sa.select(m.CounterAgent)
    if readable_fields is None:
        readable_fields = set()
    if counteagent_filter is not None:
        if isinstance(counteagent_filter, str):
            flt = filter_to_query(
                counteagent_filter,
                m.CounterAgent,
                list(
                    set(readable_fields).union(
                        {f'{field}_id' for field in readable_fields}
                    )
                ),
            )  # type: ignore
        else:
            flt = counteagent_filter
        q = q.filter(flt)  # type: ignore
    sorts = (m.CounterAgent.english_name,)
    if sort_by:
        sorts = sort_to_query(
            m.CounterAgent,
            sort_by,
            direction=sort_direction,
            available_sort_fields=[
                'english_name',
                'email',
                'group',
                'team_rqeuired',
                'status',
                'created',
                'updated',
            ],
        )
    count = await count_select_query_results(q, session=session)
    q = q.order_by(*sorts)
    if limit is not None:
        q = q.limit(limit).offset(offset)
    q = q.options(
        selectinload(m.CounterAgent.parent),
        selectinload(m.CounterAgent.agents),
        selectinload(m.CounterAgent.organization),
        selectinload(m.CounterAgent.team),
        selectinload(m.CounterAgent.manager),
    )
    results = await session.scalars(q)
    return count, results.all()
