import CloseIcon from "@mui/icons-material/Close";
import HelpIcon from "@mui/icons-material/Help";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { Hints } from "_components";
import { Modal } from "_components/modal";
import { FC, useState } from "react";
import { useMatch } from "react-router-dom";

const days = [
    {
        label: "Working day",
        type: "working_day",
        backgroundStyle: "#fff",
    },
    {
        label: "Weekend/Day off",
        type: "day_off",
        backgroundStyle: "#ffa3a6",
    },
    {
        label: "Day without activities",
        type: "day_without_activities",
        backgroundStyle: "#ee8354",
    },
    {
        label: "Day before employment",
        type: "day_before_employment",
        backgroundStyle: "#acb5bd",
    },
    {
        label: "Selected row",
        type: "selected_row",
        backgroundStyle: "#357DED",
    },
];

interface IDayTypeProps {
    day: {
        type: string;
        label: string;
        backgroundStyle: string;
    };
}

const DayType: FC<IDayTypeProps> = ({ day }) => {
    return (
        <Box display="flex" alignItems="center" gap={1}>
            <Box
                sx={{
                    width: 24,
                    height: 24,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: day.backgroundStyle,
                    border:
                        day.type === "working_day"
                            ? "1px solid #e6e8f0"
                            : "none",
                    borderRadius: "50%",
                }}
            />

            <Typography>{day.label}</Typography>
        </Box>
    );
};

const Legend: FC = () => {
    const [open, setOpen] = useState(false);
    const isCalendarReport = useMatch("/reports/calendar");

    return (
        <>
            <Modal open={open} onClose={() => setOpen(false)}>
                <Box display="flex" flexDirection="column" gap={2}>
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography fontWeight={500} fontSize={18}>
                            Report legend
                        </Typography>

                        <IconButton
                            onClick={() => setOpen(false)}
                            sx={{ p: 0 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {!isCalendarReport ? (
                        <Box display="flex" flexDirection="column" gap={1}>
                            {days.map((day) => (
                                <DayType key={nanoid()} day={day} />
                            ))}
                        </Box>
                    ) : (
                        <Hints
                            alternativeToday
                            hideNumber
                            hideBorder
                            withoutPadding
                        />
                    )}
                </Box>
            </Modal>

            <Tooltip title="Show legend" placement="top">
                <IconButton
                    onClick={() => setOpen(!open)}
                    color="info"
                    size="small"
                >
                    <HelpIcon />
                </IconButton>
            </Tooltip>
        </>
    );
};

export default Legend;
