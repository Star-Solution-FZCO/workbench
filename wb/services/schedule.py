import typing as t
from dataclasses import dataclass
from datetime import date

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from shared_utils.dateutils import date_range

__all__ = (
    'get_employee_scheduled_holidays_and_weekends',
    'get_employee_days_status',
    'calc_employee_vacation_days',
    'get_employees_days_status',
)


async def get_employee_scheduled_holidays_and_weekends(
    emp: m.Employee, start: date, end: date, session: AsyncSession
) -> tuple[set[date], set[date]]:
    schedules_raw = await session.scalars(
        sa.select(m.EmployeeSchedule).where(
            m.EmployeeSchedule.employee_id == emp.id,
            m.EmployeeSchedule.start <= end,
            sa.or_(m.EmployeeSchedule.end.is_(None), m.EmployeeSchedule.end >= start),
        )
    )
    holidays: set[date] = set()
    holidays_working: set[date] = set()
    weekends: set[date] = set()
    for sch in schedules_raw.all():
        if sch.holiday_set:
            for h in sch.holiday_set.holidays:
                if not (sch.start <= h.day and (not sch.end or sch.end >= h.day)):
                    continue
                if h.type == m.DayType.HOLIDAY:
                    holidays.add(h.day)
                elif h.type == m.DayType.WORKING_DAY:
                    holidays_working.add(h.day)
        for day in date_range(sch.start, sch.end if sch.end else end):
            if sch.get_dow_status(day.weekday()) == m.DayType.WEEKEND:
                weekends.add(day)
    weekends = weekends - holidays_working
    return holidays, weekends


@dataclass
class CalcEmployeeVacationDaysResult:
    total_vacation_year_end: int
    total_vacation_days_current: int
    count_existed_vacations: int
    count_correction: int
    free_vacation_days_year_end: int
    free_vacation_days_current: int
    count_existed_sick_days: int


async def calc_employee_vacation_days(  # pylint: disable=too-many-locals
    emp: m.Employee,
    session: AsyncSession,
) -> CalcEmployeeVacationDaysResult:
    calc_start_date = emp.contract_date if emp.contract_date else emp.work_started
    schedules_query = sa.select(m.EmployeeSchedule).where(
        m.EmployeeSchedule.employee_id == emp.id,
        sa.or_(
            m.EmployeeSchedule.end.is_(None),
            m.EmployeeSchedule.end >= calc_start_date,
        ),
    )
    schedules_raw = await session.scalars(schedules_query)
    today = date.today()
    total_vacation_days_current: float = 0
    total_vacation_year_end: float = 0
    for sch in schedules_raw.all():
        start = max(sch.start, calc_start_date)
        end_year = sch.end if sch.end else date(day=31, month=12, year=today.year)
        end_current = min(sch.end, today) if sch.end else today
        if start <= end_year:
            total_vacation_year_end += (
                ((end_year - start).days + 1) / 365 * sch.vacation_days_per_year
            )
        if start <= end_current:
            total_vacation_days_current += (
                ((end_current - start).days + 1) / 365 * sch.vacation_days_per_year
            )

    count_existed_vacations_query = sa.select(sa.func.count()).where(  # pylint: disable=not-callable
        m.EmployeeScheduleExclusion.employee_id == emp.id,
        m.EmployeeScheduleExclusion.day >= calc_start_date,
        m.EmployeeScheduleExclusion.type == m.DayType.VACATION,
        m.EmployeeScheduleExclusion.canceled.is_(None),
    )
    count_existed_vacations_raw = await session.scalar(count_existed_vacations_query)
    count_correction_query = (
        sa.select(sa.func.sum(m.EmployeeVacationCorrection.days))
        .select_from(m.EmployeeVacationCorrection)
        .where(
            m.EmployeeVacationCorrection.employee_id == emp.id,
            m.EmployeeVacationCorrection.created >= calc_start_date,
        )
    )
    count_correction_raw = await session.scalar(count_correction_query)
    count_correction: int = count_correction_raw or 0
    count_existed_vacations: int = count_existed_vacations_raw or 0
    count_existed_sick_days_query = sa.select(sa.func.count()).where(  # pylint: disable=not-callable
        m.EmployeeScheduleExclusion.employee_id == emp.id,
        m.EmployeeScheduleExclusion.day >= calc_start_date,
        m.EmployeeScheduleExclusion.type == m.DayType.SICK_DAY,
        m.EmployeeScheduleExclusion.canceled.is_(None),
    )
    count_existed_sick_days_raw = await session.scalar(count_existed_sick_days_query)
    count_existed_sick_days: int = count_existed_sick_days_raw or 0
    return CalcEmployeeVacationDaysResult(
        total_vacation_year_end=round(total_vacation_year_end),
        total_vacation_days_current=round(total_vacation_days_current),
        count_existed_vacations=count_existed_vacations,
        count_correction=count_correction,
        free_vacation_days_year_end=round(total_vacation_year_end)
        - count_existed_vacations
        + count_correction,
        free_vacation_days_current=round(total_vacation_days_current)
        - count_existed_vacations
        + count_correction,
        count_existed_sick_days=count_existed_sick_days,
    )


async def get_employee_days_status(
    emp: m.Employee, start: date, end: date, session: AsyncSession
) -> dict[date, m.DayType]:
    results = await get_employees_days_status([emp], start, end, session=session)
    return results[emp.id]


async def get_employees_days_status(
    employees: t.Sequence[m.Employee], start: date, end: date, session: AsyncSession
) -> dict[int, dict[date, m.DayType]]:
    employees_ids = {emp.id for emp in employees}
    exclusions_raw = await session.scalars(
        sa.select(m.EmployeeScheduleExclusion).where(
            m.EmployeeScheduleExclusion.employee_id.in_(employees_ids),
            m.EmployeeScheduleExclusion.day.between(start, end),
            m.EmployeeScheduleExclusion.canceled.is_(None),
        )
    )
    exclusions: dict[int, dict[date, m.DayType]] = {
        emp_id: {} for emp_id in employees_ids
    }
    for ex in exclusions_raw.all():
        exclusions[ex.employee_id][ex.day] = ex.type
    schedules_raw = await session.scalars(
        sa.select(m.EmployeeSchedule).where(
            m.EmployeeSchedule.employee_id.in_(employees_ids),
            m.EmployeeSchedule.start <= end,
            sa.or_(m.EmployeeSchedule.end.is_(None), m.EmployeeSchedule.end >= start),
        )
    )
    schedules: dict[int, list[tuple[m.EmployeeSchedule, dict[date, m.DayType]]]] = {
        emp_id: [] for emp_id in employees_ids
    }
    for schedule in schedules_raw.all():
        schedules[schedule.employee_id].append(
            (
                schedule,
                (
                    {h.day: h.type for h in schedule.holiday_set.holidays}
                    if schedule.holiday_set
                    else {}
                ),
            )
        )

    def get_day_type(u: m.Employee, d: date) -> m.DayType:
        # pylint: disable=too-many-return-statements
        if d < u.work_started:
            return m.DayType.BEFORE_EMPLOYMENT
        if u.work_ended and d > u.work_ended:
            return m.DayType.AFTER_DISMISSAL
        if d in exclusions[u.id]:
            return exclusions[u.id][d]
        for sch, hol in schedules[u.id]:
            if sch.start > d:
                continue
            if sch.end and sch.end < d:
                continue
            if d in hol:
                return hol[d]
            return sch.get_dow_status(d.weekday())
        if d.weekday() in (5, 6):
            return m.DayType.WEEKEND
        return m.DayType.WORKING_DAY

    return {
        emp.id: {d: get_day_type(emp, d) for d in date_range(start, end)}
        for emp in employees
    }
