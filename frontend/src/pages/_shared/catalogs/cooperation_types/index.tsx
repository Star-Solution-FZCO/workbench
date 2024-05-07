import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import { CooperationTypeList } from "./list";

export const CooperationTypes = () => (
    <>
        <Title title="Cooperation Types" />

        <Routes>
            <Route index element={<CooperationTypeList />} />
        </Routes>
    </>
);

export default CooperationTypes;
