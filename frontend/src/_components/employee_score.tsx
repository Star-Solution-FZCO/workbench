import { Box, Tooltip, Typography } from "@mui/material";
import { FC } from "react";

const scoreToSymbol = (score: number) => {
    if (score <= 0) {
        return "🔳";
    } else if (score < 15) {
        return "🟧";
    } else if (score < 30) {
        return "🟨";
    } else {
        return "🟩";
    }
};

export const EmployeeDoneTaskScore: FC<{ score: number }> = ({ score }) => {
    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100%"
            height="100%"
        >
            <Tooltip
                title={`Done task score for last 14 days: ${score}`}
                placement="top"
            >
                <Typography fontSize={10}>{scoreToSymbol(score)}</Typography>
            </Tooltip>
        </Box>
    );
};
