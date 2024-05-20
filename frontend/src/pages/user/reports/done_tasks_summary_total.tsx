import { DoneTasksSummaryTotal } from "_components";
import { reportsApi } from "_redux";
import ReportWrapper from "./components/report_wrapper";

const DoneTasksSummaryTotalReport = () => {
    const [geDoneTasksSummaryTotalReport, { data, isLoading, isFetching }] =
        reportsApi.useLazyGetDoneTasksSummaryTotalReportQuery();

    return (
        <ReportWrapper
            reportType="done-tasks-summary-total-report"
            queryFn={geDoneTasksSummaryTotalReport}
            isLoading={isLoading}
            isFetching={isFetching}
        >
            <DoneTasksSummaryTotal data={data?.payload?.items || []} />
        </ReportWrapper>
    );
};

export default DoneTasksSummaryTotalReport;
