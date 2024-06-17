from datetime import date, datetime
from typing import Any

import sqlalchemy as sa
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.services.employee import get_employees
from wb.utils.current_user import get_current_roles_employee_related

from ._base import BaseReportItem, ListDetailsReport, ListDetailsReportItem

__all__ = ('generate_due_date_report',)


def get_private_value(issue: m.Issue, employee: m.Employee, field: str) -> Any:
    curr_roles = get_current_roles_employee_related(employee)
    value = getattr(issue, field)
    has_access = {'self', 'team_lead', 'manager'}.intersection(curr_roles)
    return value if has_access else 'N/A'


class ReportItem(BaseReportItem):
    id: str = Field(title='ID')
    subject: str = Field(title='Subject')
    severity: str = Field(title='Severity')
    priority: str = Field(title='Priority')
    due_date: datetime = Field(title='Due Date')
    sprints: str = Field(title='Sprints')
    resolved: bool = Field(title='Resolved')
    unplanned: bool = Field(title='Unplanned')
    created: datetime = Field(title='Created')

    @classmethod
    def from_obj(cls, obj: m.Issue, employee: m.Employee) -> 'ReportItem':
        sprints = (
            'N/A'
            if get_private_value(obj, employee, 'sprints') == 'N/A'
            else ', '.join(obj.sprints)
        )
        return cls(
            id=obj.issue_id,
            subject=get_private_value(obj, employee, 'subject'),
            severity=obj.severity or '',
            priority=obj.priority or '',
            due_date=obj.due_date,
            sprints=sprints,
            resolved=obj.resolved,
            unplanned=obj.unplanned,
            created=obj.created,
        )


async def generate_due_date_report(
    flt: str | None,
    start: date,
    end: date,
    session: AsyncSession,
) -> ListDetailsReport[ReportItem]:
    _, employees = await get_employees(
        employee_filter=flt,
        session=session,
    )
    employees_ids = [emp.id for emp in employees]
    issues_query = (
        sa.select(m.Issue)
        .filter(
            m.Issue.due_date >= start,
            m.Issue.due_date <= end,
            m.Issue.assignee_id.in_(employees_ids),
        )
        .order_by(m.Issue.due_date)
    )
    issues_raw = await session.scalars(issues_query)
    issues = issues_raw.all()
    employee_issues = {
        emp.id: [issue for issue in issues if issue.assignee_id == emp.id]
        for emp in employees
    }
    results: list[ReportItem] = []
    for emp in employees:
        results.append(
            ListDetailsReportItem(
                employee=emp,
                items=[
                    ReportItem.from_obj(issue, emp) for issue in employee_issues[emp.id]
                ],
            )
        )
    return ListDetailsReport(
        items=results,
        item_type=ReportItem,
    )
