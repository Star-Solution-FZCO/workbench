import { ActivitySummaryTotal } from "_components";
import { reportsApi } from "_redux";
import ReportWrapper from "./components/report_wrapper";

const ActivitySummaryTotalReport = () => {
    const [getActivitySummaryTotalReport, { data, isLoading, isFetching }] =
        reportsApi.useLazyGetActivitySummaryTotalReportQuery();

    return (
        <ReportWrapper
            reportType="activity-summary-total-report"
            queryFn={getActivitySummaryTotalReport}
            isLoading={isLoading}
            isFetching={isFetching}
        >
            <ActivitySummaryTotal data={data?.payload?.items || []} />
        </ReportWrapper>
    );
};

export default ActivitySummaryTotalReport;
