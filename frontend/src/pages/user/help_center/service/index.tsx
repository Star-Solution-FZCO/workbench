import { useAppSelector } from "_redux";
import { Route, Routes } from "react-router-dom";
import ApplyService from "./apply";
import CreateService from "./create";
import EditService from "./edit";

const ServiceRoutes = () => {
    const profile = useAppSelector((state) => state.profile.payload);
    const adminOrHR = profile.admin || profile.hr;

    return (
        <Routes>
            <Route path=":id/apply" element={<ApplyService />} />
            {adminOrHR && (
                <>
                    <Route path="create" element={<CreateService />} />
                    <Route path="edit/:id" element={<EditService />} />
                </>
            )}
        </Routes>
    );
};

export default ServiceRoutes;
