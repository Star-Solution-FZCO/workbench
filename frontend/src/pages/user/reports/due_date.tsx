import { DueDateReportList } from "_components/reports/due_date";
import { reportsApi } from "_redux";
import ReportWrapper from "./components/report_wrapper";

const DueDateReport = () => {
    const [getDueDateReport, { data, isLoading, isFetching }] =
        reportsApi.useLazyGetDueDateReportQuery();

    return (
        <ReportWrapper
            reportType="due-date-report"
            queryFn={getDueDateReport}
            isLoading={isLoading}
            isFetching={isFetching}
        >
            <DueDateReportList items={data?.payload?.items || []} />
        </ReportWrapper>
    );
};

export default DueDateReport;
