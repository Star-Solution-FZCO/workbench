import { LinearProgress } from "@mui/material";
import { employeesApi, useAppSelector } from "_redux";
import { FC } from "react";

import {
    ApiResponse,
    CounteragentT,
    EmployeeLinkedAccountT,
    EmployeeT,
    ListResponseT,
    TeamMemberItemT,
    TeamT,
} from "types";
import TeamMembers from "./team_members";

const processLinkedAccounts = (metadata: any, members: EmployeeT[]) => {
    return members.map((member) => {
        const linkedAccounts: EmployeeLinkedAccountT[] =
            metadata?.linked_accounts[member.id] || [];

        const linkedAccountsData = linkedAccounts.reduce(
            (acc, account) => {
                const sourceName = account.source.name;
                const sourceId = account.source.id;
                acc[sourceId] = {
                    name: sourceName,
                    accountId: account.account_id,
                };
                return acc;
            },
            {} as Record<number, { name: string; accountId: string }>,
        );

        return {
            ...member,
            linkedAccounts: linkedAccountsData,
        };
    });
};

const combineTeamData = (
    membersData: ApiResponse<ListResponseT<EmployeeT>> | undefined,
    counteragentsData: ApiResponse<ListResponseT<CounteragentT>> | undefined,
): TeamMemberItemT[] => {
    const results: TeamMemberItemT[] = [];

    const members = processLinkedAccounts(
        membersData?.metadata || {},
        membersData?.payload?.items || [],
    );
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
            linkedAccounts: member.linkedAccounts,
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
            metadata={members.data?.metadata || {}}
            can_dismiss={adminOrTeamManager}
            can_edit={adminOrTeamManager}
        />
    );
};

export default TeamInfo;
