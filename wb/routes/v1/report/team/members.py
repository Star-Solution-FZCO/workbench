import typing as t
from datetime import date

import sqlalchemy as sa
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from shared_utils.dateutils import count_intersection_days
from wb.schemas import ShortTeamOut, get_employee_output_model_class
from wb.services import get_employees, get_teams_members_history

from ._base import (
    EMPLOYEE_FIELDS,
    PerMemberTeamReport,
    PerMemberTeamReportItem,
    PerMemberTeamReportMemberItem,
)

__all__ = ('generate_members_report',)


class ReportItem(PerMemberTeamReportMemberItem):
    days: int = Field(title='Days')


async def generate_members_report(
    flt: t.Any,
    start: date,
    end: date,
    session: AsyncSession,
) -> PerMemberTeamReport:
    """
    Generate a report of team members' presence within a specified date range.

    :param flt: A filter to select specific teams.
    :type flt: Any
    :param start: The start date of the report.
    :type start: date
    :param end: The end date of the report.
    :type end: date
    :param session: The database session.
    :type session: AsyncSession
    :return: The generated report.
    :rtype: PerMemberTeamReport
    :raises: None
    """
    # pylint: disable=too-many-locals
    teams_raw = await session.scalars(
        sa.select(m.Team).filter(flt).order_by(m.Team.name)
    )
    teams: dict[int, m.Team] = {team.id: team for team in teams_raw.all()}

    history_records_all = await get_teams_members_history(session=session)
    history_records = [
        rec for rec in history_records_all if rec.team_id in teams.keys()
    ]

    employee_presence_in_teams: dict[int, dict[int, list[date]]] = {
        team_id: {} for team_id in teams.keys()
    }
    for rec in history_records:
        if rec.employee_id in employee_presence_in_teams[rec.team_id]:
            in_team = len(employee_presence_in_teams[rec.team_id][rec.employee_id]) % 2
            if in_team and rec.action == 'join':
                continue
            if not in_team and rec.action == 'leave':
                continue
            employee_presence_in_teams[rec.team_id][rec.employee_id].append(
                rec.time.date()
            )
        else:
            if rec.action == 'leave':
                continue
            employee_presence_in_teams[rec.team_id][rec.employee_id] = [rec.time.date()]

    today = date.today()
    results: dict[int, dict[int, int]] = {team_id: {} for team_id in teams.keys()}
    employee_ids = set()
    for team_data in employee_presence_in_teams.values():
        for emp_id in team_data:
            employee_ids.add(emp_id)

    _, employees_ = await get_employees(
        session=session, employee_filter=m.Employee.id.in_(employee_ids)
    )
    employees: dict[int, m.Employee] = {emp.id: emp for emp in employees_}

    for team_id, team_data in employee_presence_in_teams.items():
        for emp_id, emp_data in team_data.items():
            if len(emp_data) % 2:
                emp_data.append(today)
            if employees[emp_id].work_started > end:
                results[team_id][emp_id] = 0
                continue
            results[team_id][emp_id] = sum(
                count_intersection_days(
                    (curr_start, curr_end),
                    (
                        max(start, employees[emp_id].work_started),
                        end,
                    ),
                )
                for curr_start, curr_end in zip(emp_data[::2], emp_data[1::2])
            )

    output_model_class = get_employee_output_model_class(fields=EMPLOYEE_FIELDS)
    return PerMemberTeamReport(
        items=[
            PerMemberTeamReportItem(
                team=ShortTeamOut.from_obj(team),
                items=[
                    ReportItem(
                        employee=output_model_class.from_obj(employees[emp_id]),
                        _employee=employees[emp_id],
                        days=emp_result,
                    )
                    for emp_id, emp_result in results[team.id].items()
                    if emp_result > 0
                ],
            )
            for team in teams.values()
        ],
        item_type=ReportItem,
    )
