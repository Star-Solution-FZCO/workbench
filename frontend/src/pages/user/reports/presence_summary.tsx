import { PresenceSummary } from "_components";
import { reportsApi } from "_redux";
import ReportWrapper from "./components/report_wrapper";

const PresenceSummaryReport = () => {
    const [getPresenceSummaryReport, { data, isLoading, isFetching }] =
        reportsApi.useLazyGetPresenceSummaryReportQuery();

    return (
        <ReportWrapper
            reportType="presence-summary-report"
            queryFn={getPresenceSummaryReport}
            isLoading={isLoading}
            isFetching={isFetching}
        >
            <PresenceSummary data={data?.payload?.items || []} />
        </ReportWrapper>
    );
};

export default PresenceSummaryReport;
