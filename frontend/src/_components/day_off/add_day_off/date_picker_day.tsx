/* eslint-disable @typescript-eslint/no-explicit-any */
import { styled } from "@mui/material";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers-pro";
import { dayBackgroundStyleMap } from "config";
import { DayStatusMapT, DayT } from "types";
import { getDayData } from "../../calendar/utils";

interface ICustomPickersDay extends PickersDayProps<any> {
    dayType: DayT;
}

const StyledPickersDay = styled(PickersDay, {
    shouldForwardProp: (propName: string) => !["dayType"].includes(propName),
})<ICustomPickersDay>(({ theme, outsideCurrentMonth, dayType, today }) => ({
    color: dayType !== "working_day" ? "white" : "inherit",
    ":not(.Mui-selected)": {
        border: today ? `2px solid ${theme.palette.primary.main}` : "none",
    },
    ...(!outsideCurrentMonth && {
        borderRadius: "50%",
        backgroundColor: dayBackgroundStyleMap[dayType],
        "&:hover": {
            backgroundColor: dayBackgroundStyleMap[dayType],
        },
    }),
}));

function CustomPickersDay(
    props: PickersDayProps<any> & { dayStatusMap?: DayStatusMapT },
) {
    const { day, dayStatusMap, ...other } = props;
    const dayData = getDayData(day, dayStatusMap);

    return <StyledPickersDay {...other} day={day} dayType={dayData.type} />;
}

export default CustomPickersDay;
