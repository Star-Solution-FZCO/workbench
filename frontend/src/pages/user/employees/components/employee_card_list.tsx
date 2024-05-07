import { Box, Typography } from "@mui/material";
import { FC } from "react";
import { EmployeeT } from "types";
import EmployeeCard from "./employee_card";

interface IEmployeeCardListProps {
    employees: EmployeeT[];
}

const EmployeeCardList: FC<IEmployeeCardListProps> = ({ employees }) => {
    if (employees.length === 0)
        return <Typography fontWeight={500}>No results</Typography>;

    return (
        <Box display="flex" gap="12px" flexWrap="wrap" overflow="auto">
            {employees.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
            ))}
        </Box>
    );
};

export default EmployeeCardList;
