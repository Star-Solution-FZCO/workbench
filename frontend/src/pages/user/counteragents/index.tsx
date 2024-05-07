import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import { CounteragentCreate } from "./create";
import { CounteragentList } from "./list";
import { CounteragentValidate } from "./validate";
import { CounteragentView } from "./view";

const CounteragentsRoute = () => (
    <>
        <Title title="Counteragents" />

        <Routes>
            <Route path="add" element={<CounteragentCreate />} />
            <Route path="validate" element={<CounteragentValidate />} />
            <Route path="view/:id" element={<CounteragentView />} />
            <Route path="view/:id/:tab" element={<CounteragentView />} />
            <Route index element={<CounteragentList />} />
        </Routes>
    </>
);

export default CounteragentsRoute;
