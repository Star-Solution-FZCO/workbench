import secrets
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Tuple

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

import timetracking.models as tmm
import wb.models as m
from shared_utils.dateutils import date_range
from timetracking.db import tm_async_session
from timetracking.utils import get_tm_day, get_tm_day_start
from wb.tasks.send import task_send_presence_bot_message
from wb.utils.cache import flush_cache, lru_cache

__all__ = (
    'create_tm_user',
    'update_tm_user',
    'calc_presence',
    'PresenceItem',
    'get_employee_tm_current_status',
    'set_employee_tm_current_status',
)


@dataclass
class PresenceItem:
    come: str
    leave: str
    total: timedelta
    awake: timedelta
    away: timedelta


async def update_tm_user(emp: m.Employee) -> None:
    async with tm_async_session() as tm_session:
        user: tmm.User | None = await tm_session.scalar(
            sa.select(tmm.User).where(tmm.User.email == emp.email)
        )
        if not user:
            return
        user.full_name = emp.english_name
        user.teamID = emp.team_id
        user.timezone = emp.timezone
        user.notification_chats = emp.work_notifications_chats
        user.isHidden = 'Y' if not emp.active else 'N'
        user.pararam_id = emp.pararam
        user.position = emp.position.name if emp.position else None
        user.work_started = emp.work_started
        user.uc_id = emp.id
        await tm_session.commit()


async def create_tm_user(emp: m.Employee) -> None:
    async with tm_async_session() as tm_session:
        user = tmm.User(
            full_name=emp.english_name,
            login=emp.account,
            email=emp.email,
            position=emp.position.name if emp.position else None,
            teamID=emp.team_id,
            timezone=emp.timezone,
            work_started=emp.work_started,
            uc_id=emp.id,
        )
        user.set_tm_key(secrets.token_hex(16))
        tm_session.add(user)
        await tm_session.commit()


def _calc_away_awake(recs: List[tmm.Log]) -> Tuple[timedelta, timedelta]:
    total = recs[-1].time - recs[0].time
    day_away = timedelta(0)
    t_away = None
    for rec in recs:
        if rec.type in ('away', 'go'):
            t_away = rec.time
        elif t_away and rec.type in ('awake', 'come'):
            day_away += rec.time - t_away
            t_away = None
    return day_away, total - day_away


async def calc_presence(
    users: List[tmm.User], start: date, end: date, tm_session: AsyncSession
) -> List[Dict[date, PresenceItem]]:
    # pylint: disable=too-many-locals
    tm_data_raw = await tm_session.scalars(
        sa.select(tmm.Log)
        .filter(
            tmm.Log.n.in_([u.userID for u in users]),
            tmm.Log.time >= get_tm_day_start(start),
            tmm.Log.time < get_tm_day_start(end + timedelta(days=1)),
        )
        .order_by(tmm.Log.n, tmm.Log.time)
    )
    tm_data: Dict[int, Dict[date, List[tmm.Log]]] = {
        u.userID: {d: [] for d in date_range(start, end)} for u in users
    }
    for tm_rec in tm_data_raw.all():
        tm_data[tm_rec.n][get_tm_day(tm_rec.time)].append(tm_rec)
    cur_date = date.today()
    for tm_user in users:
        transfer_come = False
        for day in date_range(start, end):
            recs = tm_data[tm_user.userID][day]
            is_current_or_future = day >= cur_date
            if transfer_come:
                recs.insert(
                    0,
                    tmm.Log(n=tm_user.userID, type='come', time=get_tm_day_start(day)),
                )
                transfer_come = False
            if not recs:
                continue
            last = recs[-1]
            next_day_start = get_tm_day_start(day + timedelta(days=1))
            if not is_current_or_future and last.type == 'away':
                recs.append(tmm.Log(n=tm_user.userID, type='go', time=next_day_start))
            elif not is_current_or_future and last.type in ('awake', 'come'):
                recs.append(tmm.Log(n=tm_user.userID, type='go', time=next_day_start))
                transfer_come = True

    results: List[Dict[date, PresenceItem]] = []
    for tm_user in users:
        result: Dict[date, PresenceItem] = {}
        for day in date_range(start, end):
            if tm_data[tm_user.userID][day]:
                come = tm_data[tm_user.userID][day][0].time.strftime('%H:%M')
                leave = tm_data[tm_user.userID][day][-1].time.strftime('%H:%M')
                if day == cur_date and tm_data[tm_user.userID][day][-1].type != 'go':
                    tm_data[tm_user.userID][day].append(
                        tmm.Log(n=tm_user.userID, type='go', time=datetime.utcnow())
                    )
                    leave = '---'
                total_day = (
                    tm_data[tm_user.userID][day][-1].time
                    - tm_data[tm_user.userID][day][0].time
                )
                away, awake = _calc_away_awake(tm_data[tm_user.userID][day])
            else:
                come = leave = ''
                total_day = away = awake = timedelta(0)
            result[day] = PresenceItem(
                come=come,
                leave=leave,
                total=total_day,
                awake=awake,
                away=away,
            )
        results.append(result)
    return results


def _convert_from_old_tm_status(status: str) -> m.TMRecordType:
    if status == 'awake':
        return m.TMRecordType.AWAKE
    if status == 'come':
        return m.TMRecordType.COME
    if status == 'away':
        return m.TMRecordType.AWAY
    return m.TMRecordType.LEAVE


def _convert_to_old_tm_status(status: m.TMRecordType) -> str:
    if status == m.TMRecordType.AWAKE:
        return 'awake'
    if status == m.TMRecordType.COME:
        return 'come'
    if status == m.TMRecordType.AWAY:
        return 'away'
    return 'go'


def _cache_key_builder_tm_current_status(
    _: Any, emp: m.Employee, *__: Any, **___: Any
) -> str:
    return f'tm-current-status-{emp.id}'


@lru_cache(ttl=2 * 60, key_builder=_cache_key_builder_tm_current_status)
async def get_employee_tm_current_status(
    emp: m.Employee, session: AsyncSession
) -> Tuple[m.TMRecordType, datetime | None]:
    user: tmm.User | None = await session.scalar(
        sa.select(tmm.User).where(tmm.User.email == emp.email)
    )
    if not user:
        return m.TMRecordType.LEAVE, None
    last_log: tmm.Log | None = await session.scalar(
        sa.select(tmm.Log)
        .where(tmm.Log.n == user.userID)
        .order_by(tmm.Log.time.desc())
        .limit(1)
    )
    if not last_log:
        return m.TMRecordType.LEAVE, None
    return _convert_from_old_tm_status(last_log.type), last_log.time


@flush_cache(key_builder=_cache_key_builder_tm_current_status)
async def set_employee_tm_current_status(
    emp: m.Employee,
    status: m.TMRecordType,
    source: str | None,
    session: AsyncSession,
    at: datetime | None = None,
    silent: bool = False,
) -> tuple[m.TMRecordType, datetime | None, bool]:
    now = at or datetime.utcnow()
    user: tmm.User | None = await session.scalar(
        sa.select(tmm.User).where(tmm.User.email == emp.email)
    )
    if not user:
        return m.TMRecordType.LEAVE, None, False
    curr_status, curr_status_time = await get_employee_tm_current_status(
        emp, session=session
    )
    if curr_status_time and curr_status_time > now:
        return curr_status, curr_status_time, False
    if curr_status == m.TMRecordType.AWAY:
        if status not in (m.TMRecordType.LEAVE, m.TMRecordType.AWAKE):
            return curr_status, curr_status_time, False
    elif curr_status in (m.TMRecordType.AWAKE, m.TMRecordType.COME):
        if status not in (m.TMRecordType.LEAVE, m.TMRecordType.AWAY):
            return curr_status, curr_status_time, False
    elif curr_status == m.TMRecordType.LEAVE:
        if status in (m.TMRecordType.AWAY, m.TMRecordType.AWAKE):
            return curr_status, curr_status_time, False
        if status == m.TMRecordType.LEAVE and (
            not curr_status_time or curr_status_time < now - timedelta(seconds=1)
        ):
            additional_come = tmm.Log(
                n=user.userID,
                type=_convert_to_old_tm_status(m.TMRecordType.COME),
                time=now - timedelta(seconds=1),
                source=source,
            )
            session.add(additional_come)
    obj = tmm.Log(
        n=user.userID,
        type=_convert_to_old_tm_status(status),
        time=now,
        source=source,
    )
    session.add(obj)
    await session.commit()
    if not silent:
        if status in (m.TMRecordType.COME, m.TMRecordType.LEAVE):
            action_str = (
                '#come to work' if status == m.TMRecordType.COME else '#leave from work'
            )
            msg = ' '.join(
                [
                    f'@{emp.pararam}' if emp.pararam else emp.english_name,
                    action_str,
                    f'by {source}' if source else '',
                    f'at {now.strftime("%H:%M")}@utc',
                ]
            )
            for chat_id in emp.work_notifications_chats:
                task_send_presence_bot_message.delay(chat_id, msg)
    return status, now, True
