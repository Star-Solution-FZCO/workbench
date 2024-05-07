import { Box, Typography } from "@mui/material";
import { Employee } from "_components";
import { FC } from "react";
import { EmployeeSelectOptionT } from "types";

interface IShortEmployeeByProps {
    label: string;
    employee: EmployeeSelectOptionT;
}

const ShortEmployeeBy: FC<IShortEmployeeByProps> = ({ label, employee }) => {
    return (
        <Box display="flex" alignItems="center" gap={1}>
            <Typography fontWeight={500}>{label}</Typography>
            <Employee
                employee={{
                    id: employee.value as number,
                    english_name: employee.label,
                    pararam: employee.pararam || "",
                }}
            />
        </Box>
    );
};

export { ShortEmployeeBy };
