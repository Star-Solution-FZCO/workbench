import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import { EmployeeAvatarInteractive } from "_components/views/manager";
import { FC } from "react";
import { UserInfoT } from "types";

export const Employee: FC<{ employee: UserInfoT }> = ({ employee }) => {
    return (
        <Box display="flex" alignItems="center" height="100%" gap={1}>
            <EmployeeAvatarInteractive employee={employee} />

            <Typography fontSize="inherit">{employee.english_name}</Typography>
        </Box>
    );
};
