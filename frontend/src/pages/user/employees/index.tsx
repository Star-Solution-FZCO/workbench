import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import { EmployeeCreate } from "./create";
import { UserEmployees } from "./list";
import { OrganizationalStructure } from "./structure";
import { EmployeeView } from "./view";

const EmployeeRoute = () => (
    <>
        <Title title="People" />

        <Routes>
            <Route path="add" element={<EmployeeCreate />} />
            <Route path="view/:id" element={<EmployeeView />} />
            <Route path="view/:id/:tab" element={<EmployeeView />} />
            <Route path="structure" element={<OrganizationalStructure />} />
            <Route index element={<UserEmployees />} />
        </Routes>
    </>
);

export default EmployeeRoute;
