import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import { AddEmployeeRequestView } from "./view";

const AddEmployeeRequestsRoutes = () => (
    <>
        <Title title="Requests - Add Employee" />

        <Routes>
            <Route path=":id" element={<AddEmployeeRequestView />} />
        </Routes>
    </>
);

export default AddEmployeeRequestsRoutes;
