import { Box } from "@mui/material";
import { Employee } from "_components";
import { dayBackgroundStyleMap } from "config";
import { eachDayOfInterval } from "date-fns";
import { FC, memo, useRef } from "react";
import { ViewportList } from "react-viewport-list";
import { DayStatusMapT, DayT, EmployeeDayStatusT } from "types";
import { formatDateYYYYMMDD } from "utils/convert";
import { mainHeadersMinWidth } from "./utils";

const getDayType = (date: Date, dayStatusMap: DayStatusMapT): DayT => {
    const defaultDayType: DayT = "working_day";
    const dateKey = formatDateYYYYMMDD(date);
    const dayType = dayStatusMap[dateKey];

    if (!dayType) return defaultDayType;

    return dayType.type;
};

interface ICalendarTableBodyProps {
    data?: EmployeeDayStatusT[];
    start: Date;
    end: Date;
}

const CalendarTableBody: FC<ICalendarTableBodyProps> = memo(
    ({ data, start, end }) => {
        const ref = useRef<HTMLTableSectionElement | null>(null);

        if (!data) return null;

        return (
            <tbody ref={ref}>
                <ViewportList viewportRef={ref} items={data}>
                    {(row) => (
                        <tr key={row.employee.id}>
                            <td
                                style={{
                                    minWidth: `${mainHeadersMinWidth}px`,
                                    background: "#ffffff",
                                    padding: "0 16px",
                                    position: "sticky",
                                    left: 0,
                                    zIndex: 1,
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Employee employee={row.employee} />
                                </Box>
                            </td>

                            {eachDayOfInterval({ start, end }).map((day) => (
                                <td
                                    key={`table-cell-${day.getFullYear()}-${
                                        day.getMonth() + 1
                                    }-${day}`}
                                    style={{
                                        minWidth: "24px",
                                        background:
                                            dayBackgroundStyleMap[
                                                getDayType(day, row.dates)
                                            ],
                                    }}
                                />
                            ))}
                        </tr>
                    )}
                </ViewportList>
            </tbody>
        );
    },
);

export { CalendarTableBody };
