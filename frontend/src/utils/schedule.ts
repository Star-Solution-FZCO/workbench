import { DayT, HolidayT } from "types";

export const isNotWorkingDay = (dayType: DayT) => {
    return [
        "weekend",
        "holiday",
        "sick_day",
        "weekend_personal_schedule",
        "vacation",
        "unpaid_leave",
    ].includes(dayType);
};

export const isNotEmploymentDay = (dayType: DayT) => {
    return ["day_before_employment", "day_after_dismissal"].includes(dayType);
};

export const convertHolidaysToDayStatusMap = (holidays: HolidayT[]) => {
    return holidays.reduce(
        (acc, holiday) => {
            const day = holiday.day;
            acc[day] = {
                type: holiday.is_working ? "working_day" : "holiday",
                name: holiday.name,
                is_working: holiday.is_working,
            };
            return acc;
        },
        {} as Record<string, { type: DayT; name: string; is_working: boolean }>,
    );
};
