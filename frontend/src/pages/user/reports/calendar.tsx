import { Box } from "@mui/material";
import CalendarTable from "_components/calendar/calendar/calendar_table";
import { scheduleApi } from "_redux";
import { useCallback, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useSearchParams } from "react-router-dom";
import ReportWrapper from "./components/report_wrapper";

const limit = 20;

const CalendarReport = () => {
    const [searchParams] = useSearchParams();

    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const start = startParam ? new Date(startParam) : new Date();
    const end = endParam ? new Date(endParam) : new Date();

    const [page, setPage] = useState(1);

    const [getCalendarReport, { data, isLoading, isFetching }] =
        scheduleApi.useLazyGetDayStatusListQuery();

    const { ref: loaderRef, entry } = useInView({
        threshold: 0,
    });

    const onIntersect = useCallback(() => {
        if (isLoading) return;
        const p = page + 1;
        setPage(p);
    }, [isLoading, page]);

    const count = data?.payload?.count || 0;
    const pageCount = Math.ceil(count / limit);

    return (
        <ReportWrapper
            reportType="calendar-report"
            queryFn={getCalendarReport}
            isLoading={isLoading}
            ioEntry={entry}
            onIntersect={onIntersect}
            page={page}
        >
            <Box maxHeight="calc(100% - 100px)">
                <CalendarTable
                    loaderRef={loaderRef}
                    data={data?.payload?.items}
                    start={start}
                    end={end}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    disableInfiniteScroll={page === pageCount}
                />
            </Box>
        </ReportWrapper>
    );
};

export default CalendarReport;
