import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, LinearProgress, Tab } from "@mui/material";
import { TeamCalendar } from "_components";
import { employeesApi } from "_redux";
import React, { useCallback } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import TeamDescription from "./components/description";
import TeamHistory from "./components/history";
import TeamInfo from "./components/info";
import { TeamStructure } from "./components/structure";

type ViewTeamPropsT = {
    id: number;
};

export const ViewTeam: React.FC<ViewTeamPropsT> = ({ id }) => {
    const { team_id, team_name: team_name_param, tab } = useParams();
    const navigate = useNavigate();

    const currentTab = tab || "info";

    const { data } = employeesApi.useGetTeamQuery({ id });

    const handleTabChange = useCallback(
        (_: React.SyntheticEvent, tab: string) => {
            if (!data) return;
            const team_name =
                team_name_param || data.payload.name.replaceAll(" ", "+");
            navigate(`/teams/view/${team_id}/${team_name}/${tab}`);
        },
        [data, team_id, team_name_param, navigate],
    );

    if (!data) return <LinearProgress />;
    if (!team_name_param) {
        <Navigate to={data.payload.name} />;
    }
    // else if (team_name_param !== data.payload.name.replaceAll(" ", "+")) {
    //     return <Navigate to=".." />;
    // }

    return (
        <Box display="flex" flexDirection="column" height="100%">
            <TeamDescription team={data.payload} />

            <TabContext value={currentTab}>
                <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 1 }}>
                    <TabList onChange={handleTabChange}>
                        <Tab label="Info" value="info" />
                        <Tab label="History" value="history" />
                        <Tab label="Calendar" value="calendar" />
                        <Tab label="Structure" value="structure" />
                    </TabList>
                </Box>

                <TabPanel value="info" sx={{ p: 1, height: "100%" }}>
                    <TeamInfo id={id} team={data.payload} />
                </TabPanel>

                <TabPanel value="history" sx={{ p: 1 }}>
                    <TeamHistory id={id} />
                </TabPanel>

                <TabPanel value="calendar" sx={{ p: 1 }}>
                    <TeamCalendar id={id} />
                </TabPanel>

                <TabPanel value="structure" sx={{ p: 1, height: "100%" }}>
                    <TeamStructure id={id} />
                </TabPanel>
            </TabContext>
        </Box>
    );
};

export const TeamView: React.FC = () => {
    const { team_id } = useParams();
    const navigate = useNavigate();

    if (team_id === undefined) navigate("..");

    return <ViewTeam id={parseInt(team_id as string)} />;
};
