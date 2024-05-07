import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { LoadingButton } from "@mui/lab";
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    IconButton,
    Typography,
} from "@mui/material";
import MDEditor from "@uiw/react-md-editor";
import { helpCenterApi, useAppSelector } from "_redux";
import { YOUTRACK_URL } from "config";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import rehypeSanitize from "rehype-sanitize";
import { YTIssueCommentT } from "types";
import { toastError } from "utils";
import { AttachmentCard } from "./attachment_card";
import { HumanReadableDateTime } from "./human_readable_datetime";

interface IRequestCommentProps {
    comment: YTIssueCommentT;
}

const RequestComment: FC<IRequestCommentProps> = ({ comment }) => {
    const profile = useAppSelector((state) => state.profile.payload);

    const [editMode, setEditMode] = useState(false);
    const [text, setText] = useState(comment.text);

    const [updateComment, updateCommentProps] =
        helpCenterApi.useUpdateHelpCenterRequestCommentMutation();
    const [deleteComment, deleteCommentProps] =
        helpCenterApi.useDeleteHelpCenterRequestCommentMutation();

    const handleClickSave = () => {
        updateComment({
            issueId: comment.issue.id,
            commentId: comment.id,
            text,
        })
            .unwrap()
            .then(() => {
                setEditMode(false);
                toast.success("Comment successfully updated");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleClickDelete = () => {
        const confirmed = confirm(
            "Are you sure you want to delete the comment?",
        );
        if (!confirmed) return;

        deleteComment({
            issueId: comment.issue.id,
            commentId: comment.id,
        })
            .unwrap()
            .then(() => {
                toast.success("Comment successfully deleted");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <Avatar src={YOUTRACK_URL + comment.author.avatarUrl} />

                    <Typography fontWeight={700}>
                        {comment.author.fullName}
                    </Typography>

                    <HumanReadableDateTime date={comment.created} />
                </Box>

                {profile.email === comment.author.email && (
                    <Box display="flex" gap={1}>
                        <IconButton
                            size="small"
                            onClick={() => setEditMode(!editMode)}
                        >
                            <EditIcon />
                        </IconButton>

                        <IconButton
                            size="small"
                            color="error"
                            onClick={handleClickDelete}
                        >
                            {deleteCommentProps.isLoading ? (
                                <CircularProgress size={20} color="info" />
                            ) : (
                                <DeleteIcon />
                            )}
                        </IconButton>
                    </Box>
                )}
            </Box>

            <Box
                data-color-mode="light"
                display="flex"
                flexDirection="column"
                gap={1}
                pl={6}
            >
                <Box className="wmde-markdown-var" />

                {editMode ? (
                    <MDEditor
                        value={text}
                        onChange={(value) => setText(value || "")}
                        previewOptions={{
                            rehypePlugins: [[rehypeSanitize]],
                        }}
                    />
                ) : (
                    <MDEditor.Markdown
                        source={comment.text}
                        style={{ whiteSpace: "pre-wrap" }}
                    />
                )}

                {comment.attachments.length > 0 && (
                    <Box display="flex" flexWrap="wrap" gap={1}>
                        {comment.attachments.map((attachment) => (
                            <AttachmentCard
                                key={attachment.id}
                                attachment={attachment}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            {editMode && (
                <Box display="flex" gap={1} pl={6}>
                    <LoadingButton
                        onClick={handleClickSave}
                        variant="outlined"
                        size="small"
                        disabled={text.length === 0}
                        loading={updateCommentProps.isLoading}
                    >
                        Save
                    </LoadingButton>
                    <Button
                        onClick={() => setEditMode(false)}
                        variant="outlined"
                        size="small"
                        color="error"
                    >
                        Cancel
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export { RequestComment };
