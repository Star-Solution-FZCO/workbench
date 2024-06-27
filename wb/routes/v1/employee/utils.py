from collections import defaultdict
from http import HTTPStatus
from typing import Literal

import sqlalchemy as sa
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.selectable import Select

import wb.models as m
from wb.schemas import SelectEmployeeField
from wb.services import get_employee_by_id
from wb.utils.current_user import current_employee

from .schemas import EmployeeHierarchy

__all__ = (
    'get_subordinates_on_update_query',
    'resolve_employee_id_param',
    'EmployeeIDParamT',
    'get_manager_chain',
    'build_hierarchy',
)

EmployeeIDParamT = int | Literal['me']


async def get_subordinates_on_update_query(session: AsyncSession) -> Select:
    curr_user = current_employee()
    result_teams = await session.scalars(
        sa.select(m.Team).where(m.Team.manager_id == curr_user.id)
    )
    current_user_teams_ids = [t.id for t in result_teams.all()]
    q = sa.select(m.Employee).where(m.Employee.active.is_(True))
    if not curr_user.is_hr and not curr_user.is_admin:
        q = q.filter(
            sa.or_(
                m.Employee.team_id.in_(current_user_teams_ids),
                m.Employee.managers.any(m.Employee.id == curr_user.id),
                m.Employee.id == curr_user.id,
            )
        )
    return q


async def resolve_employee_id_param(
    emp_id: EmployeeIDParamT, session: AsyncSession
) -> m.Employee:
    if emp_id == 'me':
        emp_id = current_employee().id
    if not isinstance(emp_id, int):
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail='invalid id')
    if not (emp := await get_employee_by_id(emp_id, session=session)):
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='user not found')
    return emp


async def get_manager_chain(
    employee_id: EmployeeIDParamT, session: AsyncSession
) -> list[m.Employee]:
    chain = []
    while True:
        employee = await resolve_employee_id_param(employee_id, session)
        if employee is None:
            break
        chain.append(employee)
        if not employee.managers:
            break
        employee_id = employee.managers[0].id
    return chain


def build_hierarchy(employees: list[m.Employee]) -> EmployeeHierarchy:
    employee_dict = {
        employee.id: {
            'name': employee.english_name,
            'attributes': SelectEmployeeField.from_obj(employee).model_dump(),
            'children': [],
        }
        for employee in employees
    }

    manager_subordinates = defaultdict(list)

    for employee in employees:
        for manager in employee.managers:
            if manager.id in employee_dict:
                manager_subordinates[manager.id].append(employee_dict[employee.id])

    def build_tree(employee_id: int):
        node = employee_dict[employee_id]
        if employee_id in manager_subordinates:
            for subordinate in manager_subordinates[employee_id]:
                child = build_tree(subordinate['attributes']['value'])
                if child not in node['children']:
                    node['children'].append(child)
        return node

    top_level_employees = [
        employee.id
        for employee in employees
        if not employee.managers
        or all(manager.id not in employee_dict for manager in employee.managers)
    ]

    if len(top_level_employees) == 1:
        top_employee_id = top_level_employees[0]
        hierarchy = build_tree(top_employee_id)
    else:
        hierarchy = {
            'name': 'root',
            'attributes': None,
            'children': [],
        }
        for top_employee_id in top_level_employees:
            hierarchy['children'].append(build_tree(top_employee_id))

    return hierarchy
