import { DayOffSummaryReport } from "_components";
import { reportsApi } from "_redux";
import ReportWrapper from "./components/report_wrapper";

const DayOffSummary = () => {
    const [getDayOffSummaryReport, { data, isLoading, isFetching }] =
        reportsApi.useLazyGetDayOffSummaryReportQuery();

    return (
        <ReportWrapper
            reportType="day-off-summary-report"
            queryFn={getDayOffSummaryReport}
            isLoading={isLoading}
            isFetching={isFetching}
        >
            <DayOffSummaryReport data={data?.payload?.items || []} />
        </ReportWrapper>
    );
};

export default DayOffSummary;
