import { Box, LinearProgress } from "@mui/material";
import { isWithinInterval } from "date-fns";
import { FC, useEffect } from "react";
import { EmployeeDayStatusT } from "types";
import { CalendarTableBody } from "./calendar_table_body";
import { CalendarTableHead } from "./calendar_table_head";

interface ITableProps {
    loaderRef?: (node?: Element | null) => void;
    data?: EmployeeDayStatusT[];
    start: Date;
    end: Date;
    isLoading?: boolean;
    isFetching?: boolean;
    disableInfiniteScroll?: boolean;
}

const CalendarTable: FC<ITableProps> = ({
    loaderRef,
    data,
    start,
    end,
    isLoading,
    isFetching,
    disableInfiniteScroll,
}) => {
    const scrollToCurrentDate = () => {
        const currentDateElement = document.getElementById("current-date");
        currentDateElement?.scrollIntoView({ inline: "center" });
    };

    useEffect(() => {
        if (isWithinInterval(new Date(), { start, end })) {
            scrollToCurrentDate();
        }
    }, [start, end]);

    if (isLoading) return <LinearProgress />;

    return (
        <Box position="relative" height="100%">
            {isFetching && (
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    height="4px"
                    zIndex={3}
                >
                    <LinearProgress />
                </Box>
            )}

            <Box
                sx={{
                    overflowX: "scroll",
                    height: "100%",
                    pb: 2,
                    "& td, th": {
                        border: "1px solid #ccc",
                    },
                }}
            >
                <table
                    style={{
                        borderSpacing: 0,
                    }}
                >
                    <CalendarTableHead
                        start={start}
                        end={end}
                        memberCount={data?.length || 0}
                    />

                    <CalendarTableBody data={data} start={start} end={end} />
                </table>

                {!disableInfiniteScroll && (
                    <Box
                        ref={loaderRef}
                        style={{
                            padding: "0 16px",
                            position: "sticky",
                            left: 0,
                            zIndex: 1,
                        }}
                    >
                        ...
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default CalendarTable;
