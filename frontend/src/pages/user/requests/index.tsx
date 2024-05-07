import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import AddEmployeeRequestsRoutes from "./add_employee";
import DismissEmployeeRequestsRoutes from "./dismiss_employee";
import JoinTeamRequestsRoutes from "./join_team";
import { ListRequests } from "./list";

const RequestRoute = () => (
    <>
        <Title title="Requests" />

        <Routes>
            <Route path="join-team/*" element={<JoinTeamRequestsRoutes />} />
            <Route
                path="add-employee/*"
                element={<AddEmployeeRequestsRoutes />}
            />
            <Route
                path="dismiss-employee/*"
                element={<DismissEmployeeRequestsRoutes />}
            />
            <Route index element={<ListRequests />} />
        </Routes>
    </>
);

export default RequestRoute;
