import styled from "@emotion/styled";
import { Box } from "@mui/material";
import { DayCalendarSkeleton } from "@mui/x-date-pickers";
import { nanoid } from "@reduxjs/toolkit";
import { currentYear } from "config";
import { chunk } from "lodash";
import { FC, memo } from "react";
import { DayStatusMapT } from "types";
import { MonthCalendar } from "./month";

const CustomDayCalendarSkeleton = styled(DayCalendarSkeleton)({
    "& .MuiDayCalendarSkeleton-daySkeleton": {
        width: "28px !important",
        height: "28px !important",
        margin: 0,
    },
});

interface ICalendarMonthTableProps {
    year: Date | null;
    months: number[];
    dayStatusMap?: DayStatusMapT;
    loading: boolean;
    alterWorkingDayColor?: boolean;
}

const CalendarMonthTable: FC<ICalendarMonthTableProps> = memo(
    ({ year, months, dayStatusMap, loading, alterWorkingDayColor }) => {
        return (
            <Box
                className="work-calendar"
                sx={{
                    "& td": {
                        verticalAlign: "top",
                        padding: "0 8px",
                    },
                }}
            >
                <table
                    style={{
                        borderSpacing: 0,
                    }}
                >
                    <tbody>
                        <tr>
                            <td
                                style={{ border: "1px solid #e6e8f1" }}
                                align="center"
                                colSpan={4}
                            >
                                {year &&
                                    months.length !== 12 &&
                                    months.includes(0) &&
                                    months.includes(11) &&
                                    `${year.getFullYear() - 1}/`}
                                {(year || new Date()).getFullYear()}
                            </td>
                        </tr>
                        {chunk(months, 4).map((months) => (
                            <tr key={nanoid()}>
                                {months.map((index) => (
                                    <MonthCalendar
                                        key={nanoid()}
                                        value={
                                            new Date(
                                                year
                                                    ? year.getFullYear()
                                                    : currentYear,
                                                index,
                                            )
                                        }
                                        dayStatusMap={dayStatusMap}
                                        renderLoading={() => (
                                            <CustomDayCalendarSkeleton />
                                        )}
                                        loading={loading}
                                        alterWorkingDayColor={
                                            alterWorkingDayColor
                                        }
                                        disabled
                                    />
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Box>
        );
    },
);

export { CalendarMonthTable };
