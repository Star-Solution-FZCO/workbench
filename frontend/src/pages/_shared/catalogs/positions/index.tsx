import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import { PositionList } from "./list";

export const Positions = () => (
    <>
        <Title title="Positions" />

        <Routes>
            <Route index element={<PositionList />} />
        </Routes>
    </>
);

export default Positions;
