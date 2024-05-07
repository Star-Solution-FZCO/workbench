import { DayOffDetailsReportList } from "_components";
import { reportsApi } from "_redux";
import ReportWrapper from "./components/report_wrapper";

const DayOffDetails = () => {
    const [getDayOffDetailsReport, { data, isLoading, isFetching }] =
        reportsApi.useLazyGetDayOffDetailsReportQuery();

    return (
        <ReportWrapper
            reportType="day-off-details-report"
            queryFn={getDayOffDetailsReport}
            isLoading={isLoading}
            isFetching={isFetching}
        >
            <DayOffDetailsReportList data={data?.payload?.items || []} />
        </ReportWrapper>
    );
};

export default DayOffDetails;
