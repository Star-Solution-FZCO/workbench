import { useAppSelector } from "_redux";
import NotFound from "pages/404";
import { Route, Routes } from "react-router-dom";
import HelpCenterAdminMain from "./main";

const AdminRoutes = () => {
    const profile = useAppSelector((state) => state.profile.payload);
    const hasAccess = profile.admin || profile.hr;

    if (!hasAccess) return <NotFound />;

    return (
        <Routes>
            <Route path=":tab" element={<HelpCenterAdminMain />} />
        </Routes>
    );
};

export default AdminRoutes;
