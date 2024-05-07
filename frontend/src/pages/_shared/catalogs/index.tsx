import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import CooperationTypes from "./cooperation_types";
import EmployeePool from "./employee_pool";
import Grades from "./grades";
import HolidaySets from "./holiday_sets";
import Organizations from "./organizations";
import Positions from "./positions";
import TeamTag from "./team_tag";

const CatalogRoutes = () => (
    <>
        <Title title="Catalogs" />

        <Routes>
            <Route path="cooperation_type/*" element={<CooperationTypes />} />
            <Route path="grade/*" element={<Grades />} />
            <Route path="holiday_set/*" element={<HolidaySets />} />
            <Route path="organization/*" element={<Organizations />} />
            <Route path="position/*" element={<Positions />} />
            <Route path="people-pool/*" element={<EmployeePool />} />
            <Route path="team-tag/*" element={<TeamTag />} />
        </Routes>
    </>
);

export default CatalogRoutes;
