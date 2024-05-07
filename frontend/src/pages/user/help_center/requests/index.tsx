import { Route, Routes } from "react-router-dom";
import RequestList from "./list";
import RequestView from "./view";

const RequestRoutes = () => {
    return (
        <Routes>
            <Route path=":id" element={<RequestView />} />
            <Route index element={<RequestList />} />
        </Routes>
    );
};

export default RequestRoutes;
