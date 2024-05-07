import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, SxProps, Tab } from "@mui/material";
import { useAppSelector } from "_redux";
import React, { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    AddEmployeeRequestListView,
    DismissEmployeeRequestListView,
    JoinTeamRequestListView,
} from "./components";

const tabPanelSxProps: SxProps = { p: 0, height: "calc(100% - 48px)" };

export const ListRequests = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const profile = useAppSelector((state) => state.profile.payload);
    const hasPrivilegies = [
        "hr",
        "recruiter",
        "admin",
        "super_hr",
        "super_admin",
    ].some((role) => profile.roles?.includes(role));

    const requestType = searchParams.get("type");
    const currentTab = requestType || "join-team";

    const handleTabChange = useCallback(
        (_: React.SyntheticEvent, newValue: string) =>
            navigate({ pathname: "/requests", search: `type=${newValue}` }),
        [navigate],
    );

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <TabContext value={currentTab}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <TabList onChange={handleTabChange}>
                        <Tab label="Join team requests" value="join-team" />
                        {hasPrivilegies && (
                            <Tab
                                label="Add employee requests"
                                value="add-employee"
                            />
                        )}

                        {hasPrivilegies && (
                            <Tab
                                label="Dismiss employee requests"
                                value="dismiss-employee"
                            />
                        )}
                    </TabList>
                </Box>

                <TabPanel value="join-team" sx={tabPanelSxProps}>
                    <JoinTeamRequestListView />
                </TabPanel>

                {hasPrivilegies && (
                    <>
                        <TabPanel value="add-employee" sx={tabPanelSxProps}>
                            <AddEmployeeRequestListView />
                        </TabPanel>
                        <TabPanel value="dismiss-employee" sx={tabPanelSxProps}>
                            <DismissEmployeeRequestListView />
                        </TabPanel>
                    </>
                )}
            </TabContext>
        </Box>
    );
};
