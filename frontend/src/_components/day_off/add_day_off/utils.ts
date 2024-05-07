import { formatDateYYYYMMDD } from "utils/convert";

export const makeMonthRange = (month: Date, range: number = 1) => {
    const y = month.getFullYear();
    const m = month.getMonth();

    const firstDayOfMonth = new Date(y, m, 1);
    const lastDayOfMonth = new Date(y, m + range, 0);

    return {
        start: formatDateYYYYMMDD(firstDayOfMonth),
        end: formatDateYYYYMMDD(lastDayOfMonth),
    };
};
