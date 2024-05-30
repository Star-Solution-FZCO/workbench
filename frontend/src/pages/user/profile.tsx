import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, LinearProgress, Tab } from "@mui/material";
import {
    EmployeeCalendar,
    EmployeeHistory,
    EmployeePresence,
    Schedule,
    Title,
    UserInfo,
} from "_components";
import { employeesApi, useAppSelector } from "_redux";
import { FC, useCallback } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import EmployeeForm from "./employees/components/form";
import WatchedAndSubordinates from "./employees/components/watched_and_subordinates";

const UserProfile: FC = () => {
    const { tab } = useParams();
    const navigate = useNavigate();

    const currentTab = tab || "info";

    const id = useAppSelector((state) => state.profile.payload.id);

    const { data, error } = employeesApi.useGetEmployeeQuery({ id });

    const { data: linkedAccounts } =
        employeesApi.useListEmployeeLinkedAccountQuery(id);

    if (error && "status" in error && error.status === 404) {
        toast.error(`User with id ${id} not found`);
        navigate("..");
    }

    const handleTabChange = useCallback(
        (_: React.SyntheticEvent, newValue: string) =>
            navigate(`/profile/${newValue}`),
        [navigate],
    );

    if (!data || !linkedAccounts) return <LinearProgress />;

    return (
        <>
            <Title title="My Profile" />

            <UserInfo data={data} />

            <TabContext value={currentTab}>
                <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 1 }}>
                    <TabList onChange={handleTabChange}>
                        <Tab label="Info" value="info" />
                        <Tab label="Presence" value="presence" />
                        <Tab label="Calendar" value="calendar" />
                        <Tab label="Schedule" value="schedule" />
                        <Tab label="History" value="history" />
                        <Tab
                            label="Watched & Subordinates"
                            value="watched_and_subordinates"
                        />
                    </TabList>
                </Box>
                <TabPanel value="info" sx={{ px: 2 }}>
                    <EmployeeForm
                        data={data}
                        linkedAccounts={linkedAccounts.payload}
                    />
                </TabPanel>
                <TabPanel value="presence" sx={{ px: 2 }}>
                    <EmployeePresence id={id} />
                </TabPanel>
                <TabPanel value="calendar" sx={{ px: 2 }}>
                    <EmployeeCalendar id={id} />
                </TabPanel>
                <TabPanel value="schedule" sx={{ px: 2 }}>
                    <Schedule id={id} />
                </TabPanel>
                <TabPanel
                    value="history"
                    sx={{ px: 2, height: "calc(100% - 154px)" }}
                >
                    <EmployeeHistory id={id} />
                </TabPanel>
                <TabPanel
                    value="watched_and_subordinates"
                    sx={{ p: 0, height: "calc(100% - 154px)" }}
                >
                    <WatchedAndSubordinates id={id} />
                </TabPanel>
            </TabContext>
        </>
    );
};

const UserProfileRoute = () => (
    <Routes>
        <Route path="/:tab" element={<UserProfile />} />
        <Route index element={<UserProfile />} />
    </Routes>
);

export default UserProfileRoute;
