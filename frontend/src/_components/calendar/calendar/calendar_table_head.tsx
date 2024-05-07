import { useTheme } from "@mui/material";
import { isToday as DateFnsIsToday, eachDayOfInterval, format } from "date-fns";
import { FC, memo } from "react";
import { mainHeadersMinWidth, makeMonthRange } from "./utils";

interface IHeadCellProps {
    date: Date;
}

const HeadCell: FC<IHeadCellProps> = ({ date }) => {
    const theme = useTheme();

    const isToday = DateFnsIsToday(date);

    return (
        <th
            id={isToday ? "current-date" : undefined}
            style={{
                ...(isToday
                    ? {
                          borderColor: theme.palette.primary.main,
                          background: theme.palette.primary.main,
                          color: "#ffffff",
                      }
                    : {
                          background: "#ffffff",
                      }),
                position: "sticky",
                top: "26px",
                zIndex: 1,
            }}
            align="center"
        >
            {date.getDate()}
        </th>
    );
};

interface ICalendarTableHeadProps {
    start: Date;
    end: Date;
    memberCount: number;
}

const CalendarTableHead: FC<ICalendarTableHeadProps> = memo(
    ({ start, end, memberCount }) => {
        return (
            <thead>
                <tr>
                    <th
                        rowSpan={2}
                        style={{
                            minWidth: `${mainHeadersMinWidth}px`,
                            background: "#f3f4f6",
                            position: "sticky",
                            left: 0,
                            top: 0,
                            zIndex: 2,
                        }}
                        align="center"
                    >
                        Full name
                    </th>

                    {/* months */}
                    {makeMonthRange(start, end).map((item, index) => (
                        <th
                            key={index}
                            colSpan={item.days}
                            style={{
                                background: "#ffffff",
                                position: "sticky",
                                top: 0,
                                zIndex: 1,
                            }}
                            align="center"
                        >
                            <p
                                style={{
                                    width: "fit-content",
                                    position: "sticky",
                                    top: 0,
                                    left: 316,
                                    right: 16,
                                    margin: "0 16px",
                                }}
                            >
                                {format(item.month, "LLLL")}
                            </p>
                        </th>
                    ))}
                </tr>

                <tr>
                    {/* Days of month */}
                    {memberCount > 0 &&
                        eachDayOfInterval({ start, end }).map((date) => (
                            <HeadCell
                                key={`head-cell-${date.getFullYear()}-${
                                    date.getMonth() + 1
                                }-${date}`}
                                date={date}
                            />
                        ))}
                </tr>
            </thead>
        );
    },
);

export { CalendarTableHead };
