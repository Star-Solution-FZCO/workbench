import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import { JoinTeamRequestView } from "./view";

const JoinTeamRequestsRoutes = () => (
    <>
        <Title title="Requests - Team Join" />

        <Routes>
            <Route path=":id" element={<JoinTeamRequestView />} />
        </Routes>
    </>
);

export default JoinTeamRequestsRoutes;
