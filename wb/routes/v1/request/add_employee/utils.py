from datetime import date, datetime

from wb.config import CONFIG
from wb.schemas.employee import SelectEmployeeField


def make_notification_message(  # pylint: disable=too-many-locals
    person: str,
    dismiss: bool = False,
    work_start_date: date | datetime | None = None,
    dismiss_datetime: date | datetime | None = None,
    position: str | None = None,
    managers: list[str] | None = None,
    mentors: list[str] | None = None,
    workplace: str | None = None,
) -> str:
    person_name = f'Person: {person}'
    start_date = (
        f'Start date: {work_start_date.strftime("%d/%m/%Y")}' if work_start_date else ''
    )
    position_str = f'Position: {position}' if position else ''
    managers_str = 'Managers: ' + ', '.join(managers) if managers else ''
    mentors_str = 'Mentors: ' + ', '.join(mentors) if mentors else ''
    workplace_str = f'Workplace: {workplace}' if workplace else ''
    dismiss_date_str = (
        f'Dismiss date: {dismiss_datetime.strftime("%d/%m/%Y")}'
        if dismiss_datetime
        else ''
    )
    entries = []
    if not dismiss:
        entries = [
            start_date,
            person_name,
            position_str,
            mentors_str,
            managers_str,
            workplace_str,
        ]
    else:
        entries = [dismiss_date_str, person_name, position_str, managers_str]
    return '\n'.join([entry for entry in entries if entry != ''])


def make_pararam_link(person: SelectEmployeeField) -> str:
    lnk = f'[{person.label}]({CONFIG.PUBLIC_BASE_URL}/employees/view/{person.value})'
    if person.pararam:
        lnk += f' (@{person.pararam})'
    return lnk
