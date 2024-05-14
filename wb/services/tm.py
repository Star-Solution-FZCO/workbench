from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any

import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from shared_utils.dateutils import date_range, day_start
from wb.tasks.send import task_send_presence_bot_message
from wb.utils.cache import flush_cache, lru_cache

__all__ = (
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


def _calc_away_awake(recs: list[m.TMRecord]) -> tuple[timedelta, timedelta]:
    total = recs[-1].time - recs[0].time
    day_away = timedelta(0)
    t_away = None
    for rec in recs:
        if rec.status in (
            m.TMRecordType.AWAY,
            m.TMRecordType.LEAVE,
        ):
            t_away = rec.time
        elif t_away and rec.status in (
            m.TMRecordType.AWAKE,
            m.TMRecordType.COME,
        ):
            day_away += rec.time - t_away
            t_away = None
    return day_away, total - day_away


async def calc_presence(
    users: list[m.Employee], start: date, end: date, session: AsyncSession
) -> list[dict[date, PresenceItem]]:
    # pylint: disable=too-many-locals
    tm_data_raw = await session.scalars(
        sa.select(m.TMRecord)
        .filter(
            m.TMRecord.employee_id.in_([u.id for u in users]),
            m.TMRecord.time >= day_start(start),
            m.TMRecord.time < day_start(end + timedelta(days=1)),
        )
        .order_by(m.TMRecord.employee_id, m.TMRecord.time)
    )
    tm_data: dict[int, dict[date, list[m.TMRecord]]] = {
        u.id: {d: [] for d in date_range(start, end)} for u in users
    }
    for tm_rec in tm_data_raw.all():
        tm_data[tm_rec.employee_id][tm_rec.time.date()].append(tm_rec)
    cur_date = date.today()
    for user in users:
        transfer_come = False
        for day in date_range(start, end):
            recs = tm_data[user.id][day]
            is_current_or_future = day >= cur_date
            if transfer_come:
                recs.insert(
                    0,
                    m.TMRecord(
                        employee_id=user.id,
                        status=m.TMRecordType.COME,
                        time=day_start(day),
                    ),
                )
                transfer_come = False
            if not recs:
                continue
            last = recs[-1]
            next_day_start = day_start(day + timedelta(days=1))
            if not is_current_or_future and last.status == m.TMRecordType.AWAY:
                recs.append(
                    m.TMRecord(
                        employee_id=user.id,
                        status=m.TMRecordType.LEAVE,
                        time=next_day_start,
                    )
                )
            elif not is_current_or_future and last.status in (
                m.TMRecordType.AWAKE,
                m.TMRecordType.COME,
            ):
                recs.append(
                    m.TMRecord(
                        employee_id=user.id,
                        status=m.TMRecordType.LEAVE,
                        time=next_day_start,
                    )
                )
                transfer_come = True

    results: list[dict[date, PresenceItem]] = []
    for user in users:
        result: dict[date, PresenceItem] = {}
        for day in date_range(start, end):
            if tm_data[user.id][day]:
                come = tm_data[user.id][day][0].time.strftime('%H:%M')
                leave = tm_data[user.id][day][-1].time.strftime('%H:%M')
                if (
                    day == cur_date
                    and tm_data[user.id][day][-1].status != m.TMRecordType.LEAVE
                ):
                    tm_data[user.id][day].append(
                        m.TMRecord(
                            employee_id=user.id,
                            status=m.TMRecordType.LEAVE,
                            time=datetime.utcnow(),
                        )
                    )
                    leave = '---'
                total_day = (
                    tm_data[user.id][day][-1].time - tm_data[user.id][day][0].time
                )
                away, awake = _calc_away_awake(tm_data[user.id][day])
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


def _cache_key_builder_tm_current_status(
    _: Any, emp: m.Employee, *__: Any, **___: Any
) -> str:
    return f'tm-current-status-{emp.id}'


@lru_cache(ttl=2 * 60, key_builder=_cache_key_builder_tm_current_status)
async def get_employee_tm_current_status(
    emp: m.Employee, session: AsyncSession
) -> tuple[m.TMRecordType, datetime | None]:
    last_log: m.TMRecord | None = await session.scalar(
        sa.select(m.TMRecord)
        .where(m.TMRecord.employee_id == emp.id)
        .order_by(m.TMRecord.time.desc())
        .limit(1)
    )
    if not last_log:
        return m.TMRecordType.LEAVE, None
    return last_log.status, last_log.time


@flush_cache(key_builder=_cache_key_builder_tm_current_status)
async def set_employee_tm_current_status(
    emp: m.Employee,
    status: m.TMRecordType,
    source: str | None,
    session: AsyncSession,
    at: datetime | None = None,
    silent: bool = False,
) -> tuple[m.TMRecordType, datetime | None, bool]:
    # pylint: disable=too-many-branches
    now = at or datetime.utcnow()
    curr_status, curr_status_time = await get_employee_tm_current_status(
        emp, session=session
    )
    records_to_add = []
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
            records_to_add.append(
                m.TMRecord(
                    employee_id=emp.id,
                    status=m.TMRecordType.COME,
                    time=now - timedelta(seconds=1),
                    source=source,
                )
            )
    records_to_add.append(
        m.TMRecord(
            employee_id=emp.id,
            status=status,
            time=now,
            source=source,
        )
    )
    try:
        async with session.begin_nested():
            for record in records_to_add:
                session.add(record)
            await session.commit()
    except IntegrityError:
        return curr_status, curr_status_time, False
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
