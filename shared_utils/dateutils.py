import typing as t
from datetime import date, datetime, time, timedelta

__all__ = (
    'count_intersection_days',
    'date_range',
    'day_start',
    'format_date',
    'format_timedelta',
    'sum_timedelta',
    'DAYS_OF_WEEK',
)

DAYS_OF_WEEK: t.Sequence[str] = (
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
)


def date_range(start: date, end: date) -> t.Iterator[date]:
    """
    Generate a range of dates between the given start and end dates.

    :param start: The start date of the range.
    :type start: date
    :param end: The end date of the range.
    :type end: date
    :return: An iterator that yields each date in the range.
    :rtype: Iterator[date]

    :Example:
    >>> from datetime import date
    >>> list(date_range(date(2022, 1, 1), date(2022, 1, 5)))
    [datetime.date(2022, 1, 1), datetime.date(2022, 1, 2), datetime.date(2022, 1, 3), datetime.date(2022, 1, 4), datetime.date(2022, 1, 5)]

    :Example:
    >>> from datetime import date
    >>> list(date_range(date(2022, 1, 5), date(2022, 1, 1)))
    [datetime.date(2022, 1, 5), datetime.date(2022, 1, 4), datetime.date(2022, 1, 3), datetime.date(2022, 1, 2), datetime.date(2022, 1, 1)]
    """
    inverted = 1
    if start > end:
        inverted = -1
    curr = start
    while 0 <= inverted * (end - curr).days:
        yield curr
        curr += inverted * timedelta(days=1)


def format_date(day: date) -> str:
    """
    Format a given date object into a string representation.

    :param day: The date object to be formatted.
    :type day: date
    :return: The formatted date string.
    :rtype: str

    :Example:
    >>> from datetime import date
    >>> format_date(date(2022, 1, 1))
    '01 Jan 2022'
    >>> format_date(date(2022, 12, 31))
    '31 Dec 2022'
    """
    return day.strftime('%d %b %Y')


def sum_timedelta(terms: t.Sequence[timedelta]) -> timedelta:
    """
    Calculate the sum of a sequence of timedelta objects.

    :param terms: A sequence of timedelta objects.
    :type terms: Sequence[timedelta]
    :return: The sum of the timedelta objects.
    :rtype: timedelta

    :Example:
    >>> from datetime import timedelta
    >>> terms = [timedelta(days=1), timedelta(hours=3), timedelta(minutes=30)]
    >>> sum_timedelta(terms)
    datetime.timedelta(days=1, seconds=12600)
    """
    res = timedelta(0)
    for term in terms:
        res += term
    return res


def format_timedelta(time_delta: timedelta) -> str:
    """
    Format a timedelta object into a string representation of hours, minutes, and seconds.

    :param time_delta: A timedelta object representing the time duration.
    :type time_delta: timedelta
    :return: A string representation of the time duration in the format 'hours:minutes:seconds'.
    :rtype: str

    :Example:
    >>> from datetime import timedelta
    >>> td = timedelta(hours=2, minutes=30, seconds=45)
    >>> format_timedelta(td)
    '2:30:45'

    >>> td = timedelta(hours=0, minutes=45, seconds=10)
    >>> format_timedelta(td)
    '0:45:10'

    >>> td = timedelta(hours=10, minutes=0, seconds=5)
    >>> format_timedelta(td)
    '10:00:05'
    """
    seconds = int(time_delta.total_seconds())
    hours, seconds = divmod(seconds, 60 * 60)
    minutes, seconds = divmod(seconds, 60)
    return f'{hours}:{minutes:02d}:{seconds:02d}'


def day_start(day: date) -> datetime:
    """
    Return the datetime object representing the start of the given day.

    :param day: A date object representing the day for which the start time is required.
    :type day: date

    :return: A datetime object representing the start of the given day.
    :rtype: datetime

    :Example:
    >>> from datetime import date, time
    >>> day = date(2022, 1, 1)
    >>> day_start(day)
    datetime.datetime(2022, 1, 1, 0, 0)
    """
    return datetime.combine(day, time())


def count_intersection_days(
    range1: t.Tuple[date, date], range2: t.Tuple[date, date]
) -> int:
    """
    Calculate the number of days in the intersection between two date ranges.

    :param range1: A tuple representing the first date range. It consists of two elements: the start date and the end date.
    :type range1: Tuple[date, date]
    :param range2: A tuple representing the second date range. It consists of two elements: the start date and the end date.
    :type range2: Tuple[date, date]
    :return: The number of days in the intersection between the two date ranges.
    :rtype: int

    :Example:
    >>> range1 = (date(2022, 1, 1), date(2022, 1, 10))
    >>> range2 = (date(2022, 1, 5), date(2022, 1, 15))
    >>> count_intersection_days(range1, range2)
    6

    >>> range1 = (date(2022, 1, 1), date(2022, 1, 10))
    >>> range2 = (date(2022, 1, 11), date(2022, 1, 15))
    >>> count_intersection_days(range1, range2)
    0

    >>> range1 = (date(2022, 1, 1), date(2022, 1, 10))
    >>> range2 = (date(2022, 1, 5), date(2022, 1, 5))
    >>> count_intersection_days(range1, range2)
    1
    """
    intersection_start = max(min(range1), min(range2))
    intersection_end = min(max(range1), max(range2))
    cnt = (intersection_end - intersection_start).days
    return cnt + 1 if cnt >= 0 else 0
