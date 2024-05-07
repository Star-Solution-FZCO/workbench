import { Route, Routes } from "react-router-dom";
import PortalView from "./view";

const PortalRoutes = () => {
    return (
        <Routes>
            <Route path=":id" element={<PortalView />} />
        </Routes>
    );
};

export default PortalRoutes;
