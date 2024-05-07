import typing as t
from datetime import date, datetime

from pydantic import BaseModel

import wb.models as m
from shared_utils import dateutils
from wb.schemas import BaseOutModel, SelectFieldInt, ShortEmployeeOut

__all__ = (
    'EmployeeScheduleOut',
    'EmployeeScheduleUpdate',
    'EmployeeScheduleExclusionCreate',
    'EmployeeScheduleMoveExclusion',
    'EmployeeScheduleMoveExclusionOut',
    'EmployeeScheduleExclusionOut',
    'EmployeeScheduleExclusionGroupedOut',
    'EmployeeVacationCorrectionOut',
    'EmployeeVacationCorrectionCreate',
    'EmployeeFreeVacationDays',
)


class WeeklySchedule(BaseModel):
    monday: m.DayType
    tuesday: m.DayType
    wednesday: m.DayType
    thursday: m.DayType
    friday: m.DayType
    saturday: m.DayType
    sunday: m.DayType

    @staticmethod
    def _get_bit(day_type: m.DayType) -> int:
        if day_type == m.DayType.WORKING_DAY:
            return 1
        if day_type == m.DayType.WEEKEND:
            return 0
        raise ValueError('wrong day type')

    @staticmethod
    def _get_type(bit: int) -> m.DayType:
        return m.DayType.WORKING_DAY if bit else m.DayType.WEEKEND

    @classmethod
    def from_bits(cls, dow: int) -> 'WeeklySchedule':
        data = {
            dateutils.DAYS_OF_WEEK[d]: cls._get_type(dow & (1 << (6 - d)))
            for d in range(len(dateutils.DAYS_OF_WEEK))
        }
        return cls(**data)

    def to_bits(self) -> int:
        res = 0
        for idx, day in enumerate(dateutils.DAYS_OF_WEEK):
            res += self._get_bit(getattr(self, day)) << (6 - idx)
        return res


class EmployeeScheduleOut(BaseModel):
    holiday_set: SelectFieldInt | None
    dow: WeeklySchedule
    start: date
    end: date | None
    vacation_days_per_year: int
    individual_working_hours: int | None
    can_remove: bool

    @classmethod
    def from_obj(cls, obj: 'm.EmployeeSchedule', can_remove: bool) -> t.Self:
        return cls(
            holiday_set=(
                SelectFieldInt.from_obj(obj.holiday_set, label='name', value='id')
                if obj.holiday_set
                else None
            ),
            dow=WeeklySchedule.from_bits(obj.dow),
            start=obj.start,
            end=obj.end,
            vacation_days_per_year=obj.vacation_days_per_year,
            individual_working_hours=obj.individual_working_hours,
            can_remove=can_remove,
        )


class EmployeeFreeVacationDays(BaseModel):
    free_vacation_days_current: int
    free_vacation_days_year_end: int


class EmployeeScheduleUpdate(BaseModel):
    holiday_set: SelectFieldInt | None = None
    dow: WeeklySchedule
    start: date
    end: date | None = None
    vacation_days_per_year: int
    individual_working_hours: int | None = None


class EmployeeScheduleExclusionCreate(BaseModel):
    start: date
    end: date
    type: m.DayType


class EmployeeScheduleMoveExclusion(BaseModel):
    weekend: date | None = None
    working_day: date | None = None


class EmployeeScheduleMoveExclusionOut(BaseModel):
    guid: str
    weekend: date | None
    working_day: date | None
    can_cancel: bool
    canceled: datetime | None


class EmployeeScheduleExclusionOut(BaseOutModel['m.EmployeeScheduleExclusion']):
    id: int
    day: date
    guid: str
    type: m.DayType
    canceled: datetime | None
    canceled_by: ShortEmployeeOut | None

    @classmethod
    def from_obj(cls, obj: 'm.EmployeeScheduleExclusion') -> t.Self:
        return cls(
            id=obj.id,
            day=obj.day,
            guid=obj.guid,
            type=obj.type,
            canceled=obj.canceled,
            canceled_by=ShortEmployeeOut.from_obj(obj.canceled_by)
            if obj.canceled_by
            else None,  # type: ignore
        )


class EmployeeScheduleExclusionGroupedOut(BaseModel):
    guid: str
    start: date
    end: date
    type: m.DayType
    days: int
    canceled: datetime | None
    canceled_by: ShortEmployeeOut | None
    can_cancel: bool


class EmployeeVacationCorrectionCreate(BaseModel):
    days: int
    description: str | None


class EmployeeVacationCorrectionOut(BaseModel):
    id: int
    days: int
    employee_id: int
    created: datetime
    created_by: ShortEmployeeOut | None
    description: str | None
    can_delete: bool

    @classmethod
    def from_obj(cls, obj: 'm.EmployeeVacationCorrection', can_delete: bool) -> t.Self:
        return cls(
            id=obj.id,
            days=obj.days,
            employee_id=obj.employee_id,
            created=obj.created,
            created_by=ShortEmployeeOut.from_obj(obj.created_by)
            if obj.created_by
            else None,  # type: ignore
            description=obj.description,
            can_delete=can_delete,
        )
