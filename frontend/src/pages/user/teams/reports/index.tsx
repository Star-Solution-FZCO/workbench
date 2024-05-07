import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import TeamMembersReport from "./members";
import TeamReports from "./reports";

const TeamReportRoutes = () => (
    <>
        <Title title="Team Reports" />

        <Routes>
            <Route path="members" element={<TeamMembersReport />} />
            <Route index element={<TeamReports />} />
        </Routes>
    </>
);

export default TeamReportRoutes;
