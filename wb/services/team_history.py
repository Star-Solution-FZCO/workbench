# pylint: skip-file
# skip this file from pylint because of "Exception on node <Compare l.28 at 0x7f070d4d75d0>"
# pylint bug: https://github.com/pylint-dev/pylint/issues/7680
import pickle
import typing as t
from dataclasses import dataclass
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m

__all__ = ('TeamMemberHistoryRecord', 'get_teams_members_history')


@dataclass
class TeamMemberHistoryRecord:
    action: t.Literal['join', 'leave']
    employee_id: int
    team_id: int
    time: datetime


async def get_teams_members_history(
    session: AsyncSession,
) -> list[TeamMemberHistoryRecord]:
    results = []
    employees_team_changes = await session.scalars(
        sa.select(m.AuditEntry).where(
            m.AuditEntry.class_name == m.Employee.__name__,
            m.AuditEntry.fields.any('team_id'),
        )
    )
    for rec in employees_team_changes.all():
        if not (changes := pickle.loads(rec.data).get('team_id')):  # type: ignore
            continue
        for team_id in changes.get('added', []):
            results.append(
                TeamMemberHistoryRecord(
                    action='join',
                    employee_id=rec.object_id,
                    team_id=team_id,
                    time=rec.time,
                )
            )
        for team_id in changes.get('deleted', []):
            results.append(
                TeamMemberHistoryRecord(
                    action='leave',
                    employee_id=rec.object_id,
                    team_id=team_id,
                    time=rec.time,
                )
            )
    return sorted(results, key=lambda r: r.time)
