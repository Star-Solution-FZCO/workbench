from enum import StrEnum

__all__ = ('DayType', 'DAY_TYPE_FIELD_MAX_LENGTH')

DAY_TYPE_FIELD_MAX_LENGTH = 32


class DayType(StrEnum):
    WORKING_DAY = 'working_day'
    WEEKEND = 'weekend'
    WORKING_DAY_PERSONAL = 'working_day_personal_schedule'
    WEEKEND_PERSONAL = 'weekend_personal_schedule'
    HOLIDAY = 'holiday'
    VACATION = 'vacation'
    UNPAID_LEAVE = 'unpaid_leave'
    SICK_DAY = 'sick_day'
    BEFORE_EMPLOYMENT = 'day_before_employment'
    AFTER_DISMISSAL = 'day_after_dismissal'
    BUSINESS_TRIP = 'business_trip'

    def is_working_day(self) -> bool:
        cls = self.__class__
        return self.value in (
            cls.WORKING_DAY,
            cls.WORKING_DAY_PERSONAL,
            cls.BUSINESS_TRIP,
        )

    def is_employed(self) -> bool:
        cls = self.__class__
        return self.value not in (
            cls.BEFORE_EMPLOYMENT,
            cls.AFTER_DISMISSAL,
        )
