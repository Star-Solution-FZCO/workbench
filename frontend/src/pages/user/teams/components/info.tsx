import { LinearProgress } from "@mui/material";
import { employeesApi, useAppSelector } from "_redux";
import { FC } from "react";

import {
    ApiResponse,
    CounteragentT,
    EmployeeT,
    ListResponseT,
    TeamMemberT,
    TeamT,
} from "types";
import TeamMembers from "./team_members";

const combineTeamData = (
    membersData: ApiResponse<ListResponseT<EmployeeT>> | undefined,
    counteragentsData: ApiResponse<ListResponseT<CounteragentT>> | undefined,
): TeamMemberT[] => {
    const results: TeamMemberT[] = [];

    const members = membersData?.payload?.items || [];
    const counteragents = counteragentsData?.payload?.items || [];

    members.forEach((member) => {
        results.push({
            id: member.id.toString(),
            english_name: member.english_name,
            pararam: member.pararam || "",
            position: member.position ? member.position.label : "",
            team_position: member.team_position || "",
            grade: member.grade?.grade || "",
            counteragent: false,
        });
    });

    counteragents.forEach((counteragent) => {
        results.push({
            id: counteragent.id + "-counteragent",
            english_name: counteragent.english_name,
            pararam: "",
            position: "",
            team_position: "",
            grade: "",
            counteragent: true,
        });
    });

    return results;
};

interface ITeamInfoProps {
    id: number;
    team: TeamT;
}

const TeamInfo: FC<ITeamInfoProps> = ({ id, team }) => {
    const profile = useAppSelector(({ profile }) => profile.payload);

    const members = employeesApi.useGetTeamMembersQuery({ id });
    const counteragents = employeesApi.useGetTeamCounteragentsQuery({ id });

    const adminOrTeamManager =
        profile.admin || profile.id === team.manager?.value;

    if (members.isLoading || counteragents.isLoading) return <LinearProgress />;

    return (
        <TeamMembers
            team_id={id}
            data={combineTeamData(members.data, counteragents.data)}
            can_dismiss={adminOrTeamManager}
            can_edit={adminOrTeamManager}
        />
    );
};

export default TeamInfo;
