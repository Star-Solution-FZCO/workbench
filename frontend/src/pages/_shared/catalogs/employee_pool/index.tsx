import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import { EmployeePoolList } from "./list";

export const EmployeePool = () => (
    <>
        <Title title="People pools" />

        <Routes>
            <Route index element={<EmployeePoolList />} />
        </Routes>
    </>
);

export default EmployeePool;
