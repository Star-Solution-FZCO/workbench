import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import { TeamTagList } from "./list";

export const TeamTag = () => (
    <>
        <Title title="Team tags" />

        <Routes>
            <Route index element={<TeamTagList />} />
        </Routes>
    </>
);

export default TeamTag;
