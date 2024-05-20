import { DoneTasksSummaryList } from "_components";
import { reportsApi } from "_redux";
import ReportWrapper from "./components/report_wrapper";

const DoneTasksSummaryReport = () => {
    const [getDoneTasksSummaryReport, { data, isLoading, isFetching }] =
        reportsApi.useLazyGetDoneTasksSummaryReportQuery();

    return (
        <ReportWrapper
            reportType="done-tasks-summary-report"
            queryFn={getDoneTasksSummaryReport}
            isLoading={isLoading}
            isFetching={isFetching}
        >
            <DoneTasksSummaryList data={data?.payload?.items || []} />
        </ReportWrapper>
    );
};

export default DoneTasksSummaryReport;
