import { Tooltip, styled } from "@mui/material";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers";
import { dayBackgroundStyleMap } from "config";
import { DayStatusMapT, DayT } from "types";
import { getDayData } from "./utils";

const daySize = 32;

interface ICustomPickerDayProps extends PickersDayProps<any> {
    size?: number;
    dayType: DayT;
    alterWorkingDayColor?: boolean;
}

const CustomPickerDay = styled(PickersDay, {
    shouldForwardProp: (propName: string) => !["dayType"].includes(propName),
})<ICustomPickerDayProps>(
    ({ today, size = daySize, dayType, theme, alterWorkingDayColor }) => ({
        width: `${size}px`,
        height: `${size}px`,
        background: alterWorkingDayColor
            ? "#7DCD85"
            : dayBackgroundStyleMap[dayType],
        "&:hover": {
            background: alterWorkingDayColor
                ? "#7DCD85"
                : dayBackgroundStyleMap[dayType],
        },
        ":disabled": {
            color:
                dayType !== "working_day" || alterWorkingDayColor
                    ? "white !important"
                    : "#121212 !important",
            border: today ? `2px solid ${theme.palette.primary.main}` : "none",
        },
        ":hover": {
            backgroundColor: "inherit",
        },
    }),
);

function Day(
    props: PickersDayProps<any> & {
        dayStatusMap?: DayStatusMapT;
        size?: number;
        alterWorkingDayColor?: boolean;
    },
) {
    const { day, dayStatusMap, size, alterWorkingDayColor, ...other } = props;

    const data = getDayData(day, dayStatusMap);

    return (
        <Tooltip title={data.name} placement="top">
            <span>
                <CustomPickerDay
                    {...other}
                    size={size}
                    day={day}
                    dayType={data.type}
                    selected={false}
                    alterWorkingDayColor={
                        alterWorkingDayColor && data.is_working
                    }
                    disableMargin
                />
            </span>
        </Tooltip>
    );
}

export { Day };
