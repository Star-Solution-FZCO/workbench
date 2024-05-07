import {
    differenceInDays,
    eachMonthOfInterval,
    endOfMonth,
    endOfYear,
    getDaysInMonth,
    startOfMonth,
    startOfYear,
} from "date-fns";
import { DayT, EmployeeT } from "types";
import { formatDateYYYYMMDD } from "utils/convert";

export const mainHeadersMinWidth = 300;
export const rowsPerPage = 10;

export const dayTypeLabels: Array<{ type: DayT; label: string }> = [
    { type: "working_day", label: "Working day" },
    { type: "weekend", label: "Weekend" },
    { type: "holiday", label: "Holiday" },
    { type: "vacation", label: "Vacation" },
    { type: "unpaid_leave", label: "Unpaid leave" },
    { type: "sick_day", label: "Sick day" },
    { type: "business_trip", label: "Business trip" },
    {
        type: "working_day_personal_schedule",
        label: "Working day (personal schedule)",
    },
    { type: "weekend_personal_schedule", label: "Weekend (personal schedule)" },
    { type: "day_before_employment", label: "Day before employment" },
    { type: "day_after_dismissal", label: "Day after dismissal" },
];

export const getDayCountInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

export const paginate = <T>(members: T[], page: number) =>
    members.slice((page - 1) * rowsPerPage, page * rowsPerPage);

export const calculatePageCount = (members: EmployeeT[]) =>
    Math.ceil(members.length / rowsPerPage);

export const makeYearRange = (year: Date) => {
    return {
        start: formatDateYYYYMMDD(startOfYear(year)),
        end: formatDateYYYYMMDD(endOfYear(year)),
    };
};

export const makeMonthRange = (start: Date, end: Date) => {
    const range = eachMonthOfInterval({ start, end });
    return range.map((month, index) => {
        let days = getDaysInMonth(month);

        if (index === 0) {
            days = differenceInDays(endOfMonth(month), start) + 1;
        }

        if (index === range.length - 1) {
            days = differenceInDays(end, startOfMonth(month)) + 1;
        }

        return {
            month,
            days,
        };
    });
};
