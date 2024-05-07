import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import CreatePolicy from "./create";
import PolicyDiff from "./diff";
import PolicyList from "./list";
import EditRevision from "./revision/edit";
import RevisionList from "./revision/list";
import RevisionView from "./revision/view";
import PolicyView from "./view";

const Policies = () => {
    return (
        <>
            <Title title="Policies" />

            <Routes>
                <Route path="view/:id" element={<PolicyView />} />
                <Route path="view/:id/revisions" element={<RevisionList />} />
                <Route
                    path="view/:id/revisions/:revision_id/view"
                    element={<RevisionView />}
                />
                <Route
                    path="view/:id/revisions/:revision_id/edit"
                    element={<EditRevision />}
                />
                <Route path="diff/:id" element={<PolicyDiff />} />
                <Route path="create" element={<CreatePolicy />} />
                <Route index element={<PolicyList />} />
            </Routes>
        </>
    );
};

export default Policies;
