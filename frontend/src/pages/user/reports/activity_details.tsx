import { ActivityDetailsList } from "_components";
import { reportsApi } from "_redux";
import ReportWrapper from "./components/report_wrapper";

const ActivityDetailsReport = () => {
    const [getActivityDetailsReport, { data, isLoading, isFetching }] =
        reportsApi.useLazyGetActivityDetailsReportQuery();

    return (
        <ReportWrapper
            reportType="activity-details-report"
            queryFn={getActivityDetailsReport}
            isLoading={isLoading}
            isFetching={isFetching}
        >
            <ActivityDetailsList detailsList={data?.payload?.items || []} />
        </ReportWrapper>
    );
};

export default ActivityDetailsReport;
