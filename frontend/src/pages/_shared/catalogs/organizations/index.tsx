import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import { OrganizationList } from "./list";

export const Organizations = () => (
    <>
        <Title title="Organizations" />

        <Routes>
            <Route index element={<OrganizationList />} />
        </Routes>
    </>
);

export default Organizations;
