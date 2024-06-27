import { Box, LinearProgress, Typography } from "@mui/material";
import { OrganizationalStructure } from "_components";
import { employeesApi } from "_redux";
import { FC } from "react";

interface ITeamStructureProps {
    id: number;
}

const TeamStructure: FC<ITeamStructureProps> = ({ id }) => {
    const { data, isLoading } =
        employeesApi.useGetEmployeeHierarchyByTeamQuery(id);

    if (isLoading) return <LinearProgress />;

    if (!data) return <Typography fontWeight={500}>No data</Typography>;

    if (!data.children.length)
        return (
            <Typography fontWeight={500}>
                No subordinates to build a hierarchy at the moment
            </Typography>
        );

    return (
        <Box display="flex" flexDirection="column" gap={0.5} height="100%">
            <Box display="flex" alignItems="center" gap={0.5}>
                The person with the colored{" "}
                <Box bgcolor="#0052cc" width="16px" height="16px" /> border is
                the manager. Click on the person to go to the person's profile.
            </Box>

            <Typography>
                Click on the person's name to expand the subordinates.
            </Typography>

            <OrganizationalStructure data={data} />
        </Box>
    );
};

export { TeamStructure };
