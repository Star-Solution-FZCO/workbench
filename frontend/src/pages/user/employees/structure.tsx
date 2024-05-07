import { Box, LinearProgress, Typography } from "@mui/material";
import { OrganizationalStructure as OrganizationalStructureComponent } from "_components";
import { employeesApi } from "_redux";

const OrganizationalStructure = () => {
    const { data, isLoading } = employeesApi.useGetEmployeeFullHierarchyQuery();

    if (isLoading) return <LinearProgress />;

    return (
        <Box display="flex" flexDirection="column" gap={0.5} height="100%">
            <Typography fontWeight={500}>Organizational structure</Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
                The person with the colored{" "}
                <Box bgcolor="#0052cc" width="16px" height="16px" /> border is
                the manager. Click on the person to go to the person's profile.
            </Box>

            <Typography>
                Click on the person's name to expand the subordinates.
            </Typography>

            {data && <OrganizationalStructureComponent data={data} />}
        </Box>
    );
};

export { OrganizationalStructure };
