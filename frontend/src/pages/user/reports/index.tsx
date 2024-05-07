import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import ActivityDetailsReport from "./activity_details";
import ActivitySummaryReport from "./activity_summary";
import ActivitySummaryTotalReport from "./activity_summary_total";
import CalendarReport from "./calendar";
import DayOffDetails from "./day_off_details";
import DayOffSummary from "./day_off_summary";
import DueDateReport from "./due_date";
import ReportMain from "./main";
import PresenceDetailsReport from "./presence_details";
import PresenceSummaryReport from "./presence_summary";
import VacationFreeDaysReport from "./vacation_free_days";

const Reports = () => {
    return (
        <>
            <Title title="Work Reports" />

            <Routes>
                <Route
                    path="activity-summary"
                    element={<ActivitySummaryReport />}
                />
                <Route
                    path="activity-summary-total"
                    element={<ActivitySummaryTotalReport />}
                />
                <Route
                    path="activity-details"
                    element={<ActivityDetailsReport />}
                />
                <Route
                    path="vacation-free-days"
                    element={<VacationFreeDaysReport />}
                />
                <Route
                    path="presence-summary"
                    element={<PresenceSummaryReport />}
                />
                <Route
                    path="presence-details"
                    element={<PresenceDetailsReport />}
                />
                <Route path="day-off-summary" element={<DayOffSummary />} />
                <Route path="day-off-details" element={<DayOffDetails />} />
                <Route path="calendar" element={<CalendarReport />} />
                <Route path="due-date" element={<DueDateReport />} />
                <Route index element={<ReportMain />} />
            </Routes>
        </>
    );
};

export default Reports;
