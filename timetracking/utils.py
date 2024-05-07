from datetime import date, datetime, time

__all__ = (
    'get_tm_day_start',
    'get_tm_day',
)


def get_tm_day_start(d: date) -> datetime:
    return datetime.combine(d, time(hour=0, minute=0, second=0, microsecond=0))


def get_tm_day(dt: datetime) -> date:
    return dt.date()
