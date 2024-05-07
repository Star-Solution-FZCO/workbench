import {
    Box,
    ToggleButton,
    ToggleButtonGroup,
    capitalize,
} from "@mui/material";
import { daysOfWeek } from "config";
import { FC } from "react";
import { DayOfWeekT, DaysOfWeekT } from "types";

interface IDaysOfWeekProps {
    schedule: DaysOfWeekT;
    onChangeSchedule?: (dow: DayOfWeekT, value: any) => void;
    disabled?: boolean;
}

const DaysOfWeek: FC<IDaysOfWeekProps> = ({
    schedule,
    onChangeSchedule,
    disabled,
}) => {
    const handleChange = (dow: DayOfWeekT, value: any) => {
        onChangeSchedule && onChangeSchedule(dow, value);
    };

    return (
        <Box display="flex">
            {daysOfWeek.map((dow) => (
                <Box display="flex" flexDirection="column" gap={1} key={dow}>
                    <Box
                        sx={{
                            padding: 1,
                            textAlign: "center",
                            border: "1px solid #E6E8F0",
                            borderRadius: "8px",
                        }}
                    >
                        {capitalize(dow)}
                    </Box>

                    <ToggleButtonGroup
                        orientation="vertical"
                        value={schedule[dow]}
                        onChange={(_, value) => handleChange(dow, value)}
                        exclusive
                        disabled={disabled}
                        size="small"
                    >
                        <ToggleButton value="working_day" color="info">
                            Working day
                        </ToggleButton>
                        <ToggleButton value="weekend" color="error">
                            Weekend
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            ))}
        </Box>
    );
};

export default DaysOfWeek;
