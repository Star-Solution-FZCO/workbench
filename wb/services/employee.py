import typing as t

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import wb.models as m
from wb.utils.db import count_select_query_results
from wb.utils.search import filter_to_query, sort_to_query

__all__ = (
    'get_employee_by_id',
    'get_employees',
    'check_similar_usernames',
)


DEFAULT_FILTER_AVAILABLE_FIELDS = frozenset(
    (
        'id',
        'uuid',
        'english_name',
        'native_name',
        'account',
        'email',
        'pararam',
        'active',
        'team_id',
        'organization_id',
        'position_id',
        'cooperation_type_id',
        'managers',
        'mentors',
        'watchers',
        'work_started',
        'roles',
        'pool_id',
        'holiday_set_id',
    )
)


async def get_employee_by_id(
    employee_id: int, session: AsyncSession
) -> m.Employee | None:
    emp: m.Employee | None = await session.scalar(
        sa.select(m.Employee)
        .where(m.Employee.id == employee_id)
        .options(
            selectinload(m.Employee.managers),
            selectinload(m.Employee.mentors),
            selectinload(m.Employee.team).selectinload(m.Team.manager),
            selectinload(m.Employee.watchers),
            selectinload(m.Employee.tm),
        )
    )
    return emp


async def get_employees(
    session: AsyncSession,
    employee_filter: str | t.Any | None = None,
    limit: int | None = None,
    offset: int = 0,
    sort_by: str | None = None,
    sort_direction: t.Literal['asc', 'desc'] = 'asc',
    readable_fields: t.Iterable[str] | None = None,
) -> t.Tuple[int, t.Sequence['m.Employee']]:
    q = sa.select(m.Employee)
    if readable_fields is None:
        readable_fields = set()
    if employee_filter is not None:
        if isinstance(employee_filter, str):
            flt = filter_to_query(
                employee_filter,
                m.Employee,
                list(
                    DEFAULT_FILTER_AVAILABLE_FIELDS.intersection(
                        set(readable_fields).union(
                            {f'{field}_id' for field in readable_fields}
                        )
                    )
                ),
            )  # type: ignore
        else:
            flt = employee_filter
        q = q.filter(flt)  # type: ignore
    sorts = (m.Employee.english_name,)
    if sort_by:
        sorts = sort_to_query(
            m.Employee,
            sort_by,
            direction=sort_direction,
            available_sort_fields=[
                'english_name',
                'native_name',
                'email',
                'account',
                'created',
            ],
        )
    count = await count_select_query_results(q, session=session)
    q = q.order_by(*sorts)
    if limit is not None:
        q = q.limit(limit).offset(offset)
    q = q.options(
        selectinload(m.Employee.managers),
        selectinload(m.Employee.mentors),
        selectinload(m.Employee.watchers),
        selectinload(m.Employee.team),
    )
    results = await session.scalars(q)
    return count, results.all()


async def check_similar_usernames(
    username: str,
    session: AsyncSession,
    exclude_account: str | None = None,
) -> str | None:
    search = username.replace('.', '_')
    q = sa.select(m.Employee).where(m.Employee.account.ilike(search))
    if exclude_account:
        q = q.where(m.Employee.account != exclude_account)
    emp_results = await session.scalars(q)
    if (emp := emp_results.first()) is not None:
        return emp.account
    q = sa.select(m.CounterAgent).where(m.CounterAgent.username.ilike(search))
    if exclude_account:
        q = q.where(m.CounterAgent.username != exclude_account)
    ca_results = await session.scalars(q)
    if (ca := ca_results.first()) is not None:
        return ca.username
    q = sa.select(m.AddEmployeeRequest).where(
        m.AddEmployeeRequest.employee_data['account'].astext.ilike(search),
        m.AddEmployeeRequest.status != 'CANCELED',
    )
    if exclude_account:
        q = q.where(
            m.AddEmployeeRequest.employee_data['account'].astext != exclude_account
        )
    req_results = await session.scalars(q)
    if (req := req_results.first()) is not None:
        return req.employee_data['account']
    return None
