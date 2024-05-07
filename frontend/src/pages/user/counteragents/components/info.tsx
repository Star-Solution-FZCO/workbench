import BlockIcon from "@mui/icons-material/Block";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
    Avatar,
    Badge,
    Box,
    IconButton,
    Tooltip,
    Typography,
} from "@mui/material";
import SpyIcon from "assets/icons/spy";
import { FC, useState } from "react";
import { CounteragentT } from "types";
import { ChangeCounterAgentStatusDialog } from "./change_status_dialog";

interface ICounteragentInfoProps {
    counteragent: CounteragentT;
}

const CounteragentInfo: FC<ICounteragentInfoProps> = ({ counteragent }) => {
    const [changeStatusDialogOpen, setChangeStatusDialogOpen] = useState(false);
    const [action, setAction] = useState<"invalidate" | "suspend" | "restore">(
        "invalidate",
    );

    const handleClickAction = (
        action: "invalidate" | "suspend" | "restore",
    ) => {
        setAction(action);
        setChangeStatusDialogOpen(true);
    };

    const canEdit = counteragent.can_edit;

    return (
        <Box display="flex" flexDirection="row" alignItems="center" gap={2}>
            <ChangeCounterAgentStatusDialog
                counteragent={counteragent}
                open={changeStatusDialogOpen}
                onClose={() => setChangeStatusDialogOpen(false)}
                action={action}
            />

            <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "top", horizontal: "left" }}
                badgeContent={
                    <Box
                        bgcolor="#fff"
                        borderRadius="50%"
                        border="1px solid #ccc"
                    >
                        <SpyIcon />
                    </Box>
                }
            >
                <Avatar
                    sx={{
                        width: 96,
                        height: 96,
                        fontSize: 36,
                    }}
                >
                    {counteragent.english_name
                        .split(" ")
                        .map((word) => word[0])}
                </Avatar>
            </Badge>

            <Typography variant={"h5"}>{counteragent.english_name}</Typography>

            {canEdit && (
                <>
                    {counteragent.status !== "INVALID" && (
                        <Tooltip title="Invalidate" placement="top">
                            <IconButton
                                sx={{ p: 0 }}
                                onClick={() => handleClickAction("invalidate")}
                                color="error"
                            >
                                <BlockIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    {counteragent.status !== "SUSPENDED" && (
                        <Tooltip title="Suspend" placement="top">
                            <IconButton
                                sx={{ p: 0 }}
                                onClick={() => handleClickAction("suspend")}
                                color="warning"
                            >
                                <PauseIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    {counteragent.status !== "VALID" && (
                        <Tooltip title="Restore" placement="top">
                            <IconButton
                                sx={{ p: 0 }}
                                onClick={() => handleClickAction("restore")}
                                color="success"
                            >
                                <PlayArrowIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </>
            )}
        </Box>
    );
};

export { CounteragentInfo };
