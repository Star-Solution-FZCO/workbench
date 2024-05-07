import { range } from "lodash";
import { DayStatusMapT, DayT } from "types";
import { formatDateYYYYMMDD } from "utils/convert";

export const makeMonthRange = (numberOfDisplayingMonths: number): number[] => {
    const currentMonth = new Date().getMonth();

    const offset = 1;

    let start = currentMonth - offset;
    let end = currentMonth + numberOfDisplayingMonths - offset;

    if (start < 0) {
        end -= start;
        start = 0;
    }

    if (end >= 11) {
        start = 12 - numberOfDisplayingMonths;
        end = 12;
    }

    return range(start, end);
};

export const getDayData = (day: Date, dayStatusMap?: DayStatusMapT) => {
    const dateKey = formatDateYYYYMMDD(day);

    const data: { type: DayT; name: string; is_working: boolean } = {
        type: "working_day",
        name: "",
        is_working: false,
    };

    if (dayStatusMap !== undefined) {
        data["type"] = dayStatusMap[dateKey]
            ? dayStatusMap[dateKey].type
            : "working_day";

        data["name"] = dayStatusMap[dateKey]?.name || "";
        data["is_working"] = dayStatusMap[dateKey]?.is_working || false;
    }

    return data;
};
