import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import ChangelogCreate from "./create";
import ChangelogEdit from "./edit";
import ChangelogList from "./list";
import ChangelogView from "./view";

const Changelog = () => {
    return (
        <>
            <Title title="Changelog" />

            <Routes>
                <Route path="create" element={<ChangelogCreate />} />
                <Route path=":id" element={<ChangelogView />} />
                <Route path=":id/edit" element={<ChangelogEdit />} />
                <Route index element={<ChangelogList />} />
            </Routes>
        </>
    );
};

export default Changelog;
