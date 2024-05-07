import { Box, LinearProgress, Typography } from "@mui/material";
import { employeesApi } from "_redux";
import { FC } from "react";
import { EmployeeT } from "types";
import { OrganizationalStructure } from "./organizational_structure";

interface IEmployeeOrgStructureProps {
    employee: EmployeeT;
}

const EmployeeOrgStructure: FC<IEmployeeOrgStructureProps> = ({ employee }) => {
    const { data, isLoading } = employeesApi.useGetEmployeeHierarchyQuery(
        employee.id,
    );

    if (isLoading) {
        return (
            <Box width="1000px" height="800px">
                <LinearProgress />
            </Box>
        );
    }

    return (
        <Box
            width="1000px"
            height="800px"
            display="flex"
            flexDirection="column"
            gap={1}
        >
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                <Typography fontWeight={500}>
                    Organizational structure of {employee.english_name}
                </Typography>
            </Box>

            {data && <OrganizationalStructure data={data} />}
        </Box>
    );
};

export { EmployeeOrgStructure };
