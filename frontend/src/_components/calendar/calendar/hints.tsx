import { Box, Typography } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { dayBackgroundStyleMap } from "config";
import { FC } from "react";
import { DayT } from "types";
import { dayTypeLabels } from "./utils";

interface IHintProps {
    dayTypeLabel: {
        type: DayT;
        label: string;
    };
    hideNumber?: boolean;
}

const Hint: FC<IHintProps> = ({ dayTypeLabel, hideNumber }) => {
    return (
        <Box display="flex" alignItems="flex-start" gap={1}>
            <Box
                sx={{
                    minWidth: 24,
                    minHeight: 24,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    boxSizing: "border-box",
                    background: dayBackgroundStyleMap[dayTypeLabel.type],
                    color:
                        dayTypeLabel.type === "working_day"
                            ? "inherit"
                            : "#fff",
                    outline:
                        dayTypeLabel.type === "working_day"
                            ? "1px solid #e6e8f0"
                            : "none",
                    outlineOffset: "-1px",
                    borderRadius: "50%",
                }}
            >
                {!hideNumber && "1"}
            </Box>

            <Typography fontWeight={500} fontSize={14} lineHeight="24px">
                {dayTypeLabel.label}
            </Typography>
        </Box>
    );
};

interface IHintsProps {
    alternativeToday?: boolean;
    showCurrentMonthHint?: boolean;
    hideNumber?: boolean;
    hideBorder?: boolean;
    withoutPadding?: boolean;
}

const Hints: FC<IHintsProps> = ({
    alternativeToday,
    showCurrentMonthHint,
    hideNumber,
    hideBorder,
    withoutPadding,
}) => {
    return (
        <Box
            className="calendar-hints"
            sx={{
                display: "flex",
                width: "fit-content",
                border: !hideBorder ? "1px solid #e6e8f0" : "none",
                borderRadius: !hideBorder ? 0.5 : "none",
                padding: !withoutPadding ? 1 : 0,
                gap: 1,
            }}
        >
            <Box display="flex" flexDirection="column" gap="2px">
                <Box display="flex" alignItems="flex-start" gap={1}>
                    <Box
                        sx={({ palette }) => ({
                            width: 24,
                            height: 24,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            background: alternativeToday
                                ? palette.primary.main
                                : "transparent",
                            border: `2px solid ${palette.primary.main}`,
                            borderRadius: "50%",
                        })}
                    >
                        {!alternativeToday && "1"}
                    </Box>

                    <Typography fontWeight={500} fontSize={14}>
                        Today
                    </Typography>
                </Box>

                {showCurrentMonthHint && (
                    <Box display="flex" alignItems="flex-start" gap={1}>
                        <Box
                            sx={{
                                minWidth: 24,
                                minHeight: 24,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                outline: "2px solid #5ea9e9",
                                outlineOffset: "-2px",
                            }}
                        />

                        <Typography fontWeight={500} fontSize={14}>
                            Current month
                        </Typography>
                    </Box>
                )}

                {dayTypeLabels.slice(0, 4).map((dayTypeLabel) => (
                    <Hint
                        key={nanoid()}
                        dayTypeLabel={dayTypeLabel}
                        hideNumber={hideNumber}
                    />
                ))}
            </Box>

            <Box display="flex" flexDirection="column" gap="2px">
                {dayTypeLabels.slice(4).map((dayTypeLabel) => (
                    <Hint
                        key={nanoid()}
                        dayTypeLabel={dayTypeLabel}
                        hideNumber={hideNumber}
                    />
                ))}
            </Box>
        </Box>
    );
};

export { Hints };
