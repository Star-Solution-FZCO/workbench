import { ActivitySummaryList } from "_components";
import { reportsApi } from "_redux";
import { useMatch } from "react-router-dom";
import ReportWrapper from "./components/report_wrapper";

const ActivitySummaryReport = () => {
    const [getActivitySummaryReport, { data, isLoading, isFetching }] =
        reportsApi.useLazyGetActivitySummaryReportQuery();

    const isMyReportPage = useMatch("/my-reports/*");

    return (
        <ReportWrapper
            reportType="activity-summary-report"
            queryFn={getActivitySummaryReport}
            isLoading={isLoading}
            isFetching={isFetching}
        >
            <ActivitySummaryList
                summaryList={data?.payload?.items || []}
                hideEmployee={!!isMyReportPage}
            />
        </ReportWrapper>
    );
};

export default ActivitySummaryReport;
