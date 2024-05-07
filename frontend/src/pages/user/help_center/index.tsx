import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import AdminRoutes from "./admin";
import HelpCenterMain from "./main";
import PortalRoutes from "./portal";
import RequestRoutes from "./requests";
import ServiceRoutes from "./service";

const HelpCenter = () => {
    return (
        <>
            <Title title="Help Center" />

            <Routes>
                <Route path="admin/*" element={<AdminRoutes />} />
                <Route path="portal/*" element={<PortalRoutes />} />
                <Route path="requests/*" element={<RequestRoutes />} />
                <Route path="services/*" element={<ServiceRoutes />} />
                <Route index element={<HelpCenterMain />} />
            </Routes>
        </>
    );
};

export default HelpCenter;
