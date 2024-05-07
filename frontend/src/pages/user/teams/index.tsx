import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import { TeamList } from "./list";
import TeamReportRoutes from "./reports";
import { TeamView } from "./view";
import { EmployeeWithoutTeam } from "./without_team";

const TeamRoutes = () => (
    <>
        <Title title="Teams" />

        <Routes>
            <Route path="view/:team_id" element={<TeamView />} />
            <Route path="view/:team_id/:team_name" element={<TeamView />} />
            <Route
                path="view/:team_id/:team_name/:tab"
                element={<TeamView />}
            />
            <Route path="without-team" element={<EmployeeWithoutTeam />} />
            <Route path="reports/*" element={<TeamReportRoutes />} />
            <Route index element={<TeamList />} />
        </Routes>
    </>
);

export default TeamRoutes;
