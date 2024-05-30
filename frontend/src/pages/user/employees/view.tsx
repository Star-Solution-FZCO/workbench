import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, LinearProgress, Tab } from "@mui/material";
import {
    EmployeeCalendar,
    EmployeeHistory,
    EmployeePresence,
    Schedule,
} from "_components";
import { UserInfo } from "_components/user_info";
import { employeesApi } from "_redux";
import React, { FC, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import EmployeeForm from "./components/form";

export const EmployeeView: FC = () => {
    const { tab, id } = useParams();
    const navigate = useNavigate();

    const employeeId = parseInt(id as string);

    const currentTab = tab || "info";

    if (!id) navigate("..");

    const { data, error } = employeesApi.useGetEmployeeQuery({
        id: parseInt(id as string),
    });

    const { data: linkedAccounts } =
        employeesApi.useListEmployeeLinkedAccountQuery(employeeId);

    if (error && "status" in error && error.status === 404) {
        toast.error(`User with id ${id} not found`);
        navigate("..");
    }

    const handleTabChange = useCallback(
        (_: React.SyntheticEvent, newValue: string) =>
            navigate(`../view/${id}/${newValue}`),
        [id, navigate],
    );

    if (!data || !linkedAccounts) return <LinearProgress />;

    return (
        <>
            <UserInfo data={data} />

            <TabContext value={currentTab}>
                <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 1 }}>
                    <TabList onChange={handleTabChange}>
                        <Tab label="Info" value="info" />
                        <Tab label="Presence" value="presence" />
                        <Tab label="Calendar" value="calendar" />
                        <Tab label="Schedule" value="schedule" />
                        <Tab label="History" value="history" />
                    </TabList>
                </Box>
                <TabPanel value="info" sx={{ px: 2 }}>
                    <EmployeeForm
                        data={data}
                        linkedAccounts={linkedAccounts.payload}
                    />
                </TabPanel>
                <TabPanel value="presence" sx={{ px: 2 }}>
                    <EmployeePresence id={employeeId} />
                </TabPanel>
                <TabPanel value="calendar" sx={{ px: 2 }}>
                    <EmployeeCalendar id={employeeId} />
                </TabPanel>
                <TabPanel value="schedule" sx={{ px: 2 }}>
                    <Schedule id={employeeId} />
                </TabPanel>
                <TabPanel
                    value="history"
                    sx={{ px: 0, height: "calc(100% - 154px)" }}
                >
                    <EmployeeHistory id={employeeId} />
                </TabPanel>
            </TabContext>
        </>
    );
};
