import { styled } from "@mui/material";
import {
    DateRangePickerDay,
    DateRangePickerDayProps,
} from "@mui/x-date-pickers-pro";
import { dayBackgroundStyleMap } from "config";
import { DayStatusMapT, DayT } from "types";
import { getDayData } from "../../calendar/utils";

interface ICustomDateRangePickerDay extends DateRangePickerDayProps<any> {
    dayType: DayT;
}

const StyledDateRangePickerDay = styled(DateRangePickerDay, {
    shouldForwardProp: (propName: string) => !["dayType"].includes(propName),
})<ICustomDateRangePickerDay>(
    ({ theme, isHighlighting, outsideCurrentMonth, dayType, today }) => ({
        "& button": {
            color: dayType !== "working_day" ? "white" : "inherit",
        },
        ":not(.Mui-selected)": {
            "& button": {
                border: today
                    ? `2px solid ${theme.palette.primary.main} !important`
                    : "none",
            },
        },
        ...(!outsideCurrentMonth &&
            !isHighlighting && {
                backgroundColor: dayBackgroundStyleMap[dayType],
                borderRadius: "50%",
            }),
        ...(isHighlighting &&
            !outsideCurrentMonth && {
                backgroundColor: theme.palette.info.main,
                "& button": {
                    color: "white",
                    opacity: 1,
                    fontWeight: 500,
                },
            }),
    }),
);

function CustomDateRangePickerDay(
    props: DateRangePickerDayProps<any> & { dayStatusMap?: DayStatusMapT },
) {
    const { day, dayStatusMap, ...other } = props;
    const dayData = getDayData(day, dayStatusMap);

    return (
        <StyledDateRangePickerDay {...other} day={day} dayType={dayData.type} />
    );
}

export default CustomDateRangePickerDay;
