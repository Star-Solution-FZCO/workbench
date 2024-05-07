import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { helpCenterApi, useAppSelector } from "_redux";
import { YOUTRACK_URL } from "config";
import { FC } from "react";
import { toast } from "react-toastify";
import { YTAttachmentT } from "types";
import { toastError } from "utils";

const isImage = (filename: string) =>
    /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(filename);

interface IAttachmentCardProps {
    attachment: YTAttachmentT;
}

const AttachmentCard: FC<IAttachmentCardProps> = ({ attachment }) => {
    const userEmail = useAppSelector((state) => state.profile.payload.email);

    const [deleteAttachment] =
        helpCenterApi.useDeleteHelpCenterRequestAttachmentMutation();

    const handleClickCard = () => {
        window.open(YOUTRACK_URL + attachment.url);
    };

    const handleClickDelete = (e: React.MouseEvent) => {
        e.stopPropagation();

        const confirmed = confirm(
            "Are you sure you want to delete the attachment?",
        );
        if (!confirmed) return;

        deleteAttachment({
            issueId: attachment.issue.id,
            attachmentId: attachment.id,
        })
            .unwrap()
            .then(() => {
                toast.success("Attachment successfully deleted");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const canDelete = userEmail === attachment.author.email;

    return (
        <Box
            sx={{
                width: "120px",
                height: "80px",
                position: "relative",
                borderRadius: 1,
                border: "1px solid #ccc",
                cursor: "pointer",
                "& img": {
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: 1,
                },
                "& .controls": {
                    display: "none",
                    flexDirection: "column",
                    position: "absolute",
                    background: "rgba(0, 0, 0, .5)",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    zIndex: 1,
                    borderRadius: 1,
                    p: 1,
                },
                "&:hover": {
                    "& .controls": {
                        display: "flex",
                    },
                },
            }}
            title={attachment.name}
            onClick={handleClickCard}
        >
            <Box className="controls">
                <Box display="flex" alignItems="flex-end" gap={1} height="100%">
                    {canDelete && (
                        <Tooltip title="Delete" placement="bottom">
                            <IconButton
                                onClick={handleClickDelete}
                                color="error"
                                sx={{ p: 0 }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {isImage(attachment.name) ? (
                <img
                    src={YOUTRACK_URL + attachment.thumbnailURL}
                    alt={attachment.name}
                />
            ) : (
                <Box display="flex" flexDirection="column" gap={1} p={1}>
                    <Chip
                        sx={{ alignSelf: "flex-start" }}
                        label={attachment.extension.toUpperCase()}
                        size="small"
                    />
                    <Typography
                        sx={{
                            fontSize: 14,
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            wordWrap: "break-word",
                        }}
                    >
                        {attachment.name}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export { AttachmentCard };
