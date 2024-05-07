import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Tab } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "../components";
import { PortalGroupsList, PortalList, ServiceList } from "./components";

const HelpCenterAdminMain = () => {
    const { tab } = useParams();
    const navigate = useNavigate();

    const currentTab = tab || "services";

    const handleChangeTab = (_: React.SyntheticEvent, newValue: string) =>
        navigate(`/help-center/admin/${newValue}`);

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box display="flex" gap={1}>
                <Link to="/help-center">Help center</Link>
                <Link to="/help-center/requests">Requests</Link>
            </Box>

            <TabContext value={currentTab}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <TabList onChange={handleChangeTab}>
                        <Tab label="Services" value="services" />
                        <Tab label="Portals" value="portals" />
                        <Tab label="Portal groups" value="portal_groups" />
                    </TabList>
                </Box>

                <TabPanel value="services" sx={{ p: 0, height: "100%" }}>
                    <ServiceList />
                </TabPanel>
                <TabPanel value="portals" sx={{ p: 0, height: "100%" }}>
                    <PortalList />
                </TabPanel>
                <TabPanel value="portal_groups" sx={{ p: 0, height: "100%" }}>
                    <PortalGroupsList />
                </TabPanel>
            </TabContext>
        </Box>
    );
};

export default HelpCenterAdminMain;
