import { PresenceDetailsList } from "_components";
import { reportsApi } from "_redux";
import ReportWrapper from "./components/report_wrapper";

const PresenceDetailsReport = () => {
    const [getPresenceDetailsReport, { data, isLoading, isFetching }] =
        reportsApi.useLazyGetPresenceDetailsReportQuery();

    return (
        <ReportWrapper
            reportType="presence"
            queryFn={getPresenceDetailsReport}
            isLoading={isLoading}
            isFetching={isFetching}
        >
            <PresenceDetailsList presenceList={data?.payload?.items || []} />
        </ReportWrapper>
    );
};

export default PresenceDetailsReport;
