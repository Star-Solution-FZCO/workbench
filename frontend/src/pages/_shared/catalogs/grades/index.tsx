import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import { GradeList } from "./list";

export const Grades = () => (
    <>
        <Title title="Grades" />

        <Routes>
            <Route index element={<GradeList />} />
        </Routes>
    </>
);

export default Grades;
