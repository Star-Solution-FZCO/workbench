/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, styled } from "@mui/material";
import { DateCalendar, DateCalendarProps } from "@mui/x-date-pickers";
import { nanoid } from "@reduxjs/toolkit";
import { addDays, format, isThisMonth, startOfWeek } from "date-fns";
import { FC } from "react";
import { DayStatusMapT } from "types";
import { Day } from "./day";

const StyledDateCalendar = styled(DateCalendar, {
    shouldForwardProp: (propName: string) =>
        !["dayStatusMap"].includes(propName),
})({
    width: "auto",
    height: "auto",
    "& .MuiPickersCalendarHeader-root": {
        display: "none",
    },
    "& .MuiDayCalendar-slideTransition": {
        minHeight: "unset",
    },
    "& .MuiDayCalendar-header": {
        display: "none",
    },
});

interface IMonthCalendarProps extends DateCalendarProps<any> {
    dayStatusMap?: DayStatusMapT;
    alterWorkingDayColor?: boolean;
}

const MonthCalendar: FC<IMonthCalendarProps> = (props) => {
    const firstDayOfWeek = startOfWeek(new Date());

    return (
        <td
            style={{
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: isThisMonth(props.value) ? "#5DA9E9" : "#e6e8f0",
            }}
        >
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap="4px"
            >
                <Box
                    fontWeight="500"
                    sx={{
                        width: "100%",
                        textAlign: "center",
                        color: isThisMonth(props.value) ? "white" : "inherit",
                        backgroundColor: isThisMonth(props.value)
                            ? "#5DA9E9"
                            : "transparent",
                        borderBottomLeftRadius: "4px",
                        borderBottomRightRadius: "4px",
                    }}
                >
                    {format(props.defaultValue || props.value, "LLLL")}
                </Box>

                <Box display="flex" justifyContent="center">
                    {[...Array(7).keys()].map((index) => (
                        <Box
                            key={nanoid()}
                            sx={{
                                width: "28px",
                                height: "28px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontSize: "12px",
                            }}
                        >
                            {format(addDays(firstDayOfWeek, index + 1), "E")}
                        </Box>
                    ))}
                </Box>

                <StyledDateCalendar
                    {...props}
                    slots={{ day: Day }}
                    slotProps={
                        {
                            day: {
                                dayStatusMap: props.dayStatusMap,
                                size: 28,
                                alterWorkingDayColor:
                                    props.alterWorkingDayColor,
                            },
                        } as any
                    }
                    readOnly
                    reduceAnimations
                />
            </Box>
        </td>
    );
};

export { MonthCalendar };
