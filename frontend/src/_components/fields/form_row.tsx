import { Box, Typography } from "@mui/material";
import { FC } from "react";

interface IRowProps extends React.PropsWithChildren {
    label: string;
}

const FormRow: FC<IRowProps> = ({ label, children }) => (
    <Box display="flex">
        <Box width="300px">
            <Typography fontWeight={500}>{label}</Typography>
        </Box>

        <Box width="350px">{children}</Box>
    </Box>
);

export { FormRow };
