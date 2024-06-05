import { DayT } from "types";
import { isNotEmploymentDay, isNotWorkingDay } from "utils/schedule";

const gradientStart = [160, 250, 160];
const gradientEnd = [0, 100, 0];
const maxScore = 15;

const gradientColor = (score: number) => {
    const gradientResult = gradientStart.map((startColor, idx) =>
        Math.round(
            startColor +
                ((gradientEnd[idx] - startColor) * Math.min(score, maxScore)) /
                    maxScore,
        )
            .toString(16)
            .padStart(2, "0"),
    );
    return `#${gradientResult.join("")}`;
};

export const weightedSumDayColor = (score: number, dayType: DayT) => {
    if (score > 0) {
        return gradientColor(score);
    }
    if (
        isNotWorkingDay(dayType) ||
        isNotEmploymentDay(dayType) ||
        dayType === "business_trip"
    ) {
        return "#ffffff";
    }
    return "#bbbbbb";
};
