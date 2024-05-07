import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import { DismissEmployeeRequestView } from "./view";

const DismissEmployeeRequestsRoutes = () => (
    <>
        <Title title="Requests - Dismiss Employee" />

        <Routes>
            <Route path=":id" element={<DismissEmployeeRequestView />} />
        </Routes>
    </>
);

export default DismissEmployeeRequestsRoutes;
