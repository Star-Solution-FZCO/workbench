import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, LinearProgress, Tab } from "@mui/material";
import { employeesApi, useAppSelector } from "_redux";
import { useCallback } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
    CounteragentCredentials,
    CounteragentForm,
    CounteragentInfo,
} from "./components";

const CounteragentView = () => {
    const navigate = useNavigate();
    const { id, tab } = useParams();

    const profile = useAppSelector((state) => state.profile.payload);

    const currentTab = tab || "info";

    const handleTabChange = useCallback(
        (_: React.SyntheticEvent, newValue: string) =>
            navigate(`../view/${id}/${newValue}`),
        [id, navigate],
    );

    if (!id) return <Navigate to="/counteragents" />;

    const { data, isLoading } = employeesApi.useGetCounteragentQuery(
        Number(id),
    );

    const counteragent = data?.payload;

    if (!counteragent) return null;
    if (isLoading) return <LinearProgress />;

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <CounteragentInfo counteragent={counteragent} />

            <TabContext value={currentTab}>
                <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 1 }}>
                    <TabList onChange={handleTabChange}>
                        <Tab label="Info" value="info" />
                        {profile.admin && (
                            <Tab label="Credentials" value="credentials" />
                        )}
                    </TabList>
                </Box>
                <TabPanel value="info" sx={{ px: 2 }}>
                    <CounteragentForm data={counteragent} />
                </TabPanel>
                <TabPanel value="credentials" sx={{ px: 2, height: "100%" }}>
                    <CounteragentCredentials id={counteragent.id} />
                </TabPanel>
            </TabContext>
        </Box>
    );
};

export { CounteragentView };
