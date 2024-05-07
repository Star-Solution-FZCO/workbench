import AttachFileIcon from "@mui/icons-material/AttachFile";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Chip,
    Divider,
    LinearProgress,
    Typography,
} from "@mui/material";
import MDEditor from "@uiw/react-md-editor";
import { EmployeeAvatar } from "_components/views/manager";
import { helpCenterApi, useAppSelector } from "_redux";
import NotFound from "pages/404";
import { FC, Fragment, useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import rehypeSanitize from "rehype-sanitize";
import { YTUserT } from "types";
import { toastError } from "utils";
import {
    AttachmentCard,
    FileCard,
    HumanReadableDateTime,
    Link,
    RequestComment,
    ServiceHeader,
} from "../components";

interface IUserDateInfoProps {
    label: string;
    user: YTUserT;
    date: number;
}

const UserDateInfo: FC<IUserDateInfoProps> = ({ label, user, date }) => {
    return (
        <Typography fontSize={14} fontWeight={500}>
            {label} {user.fullName} <HumanReadableDateTime date={date} />
        </Typography>
    );
};

const RequestView = () => {
    const { id } = useParams();

    const profile = useAppSelector((state) => state.profile.payload);

    const [commentary, setCommentary] = useState("");
    const [files, setFiles] = useState<File[]>([]);

    const { data, isLoading, error } =
        helpCenterApi.useGetHelpCenterRequestQuery(id!, {
            skip: !id,
        });

    const [createRequestComment, createCommentProps] =
        helpCenterApi.useCreateHelpCenterRequestCommentMutation();
    const [uploadRequestCommentAttachments, uploadCommentAttachmentsProps] =
        helpCenterApi.useUploadHelpCenterRequestCommentAttachmentsMutation();
    const [resolveRequest, resolveRequestProps] =
        helpCenterApi.useResolveHelpCenterRequestMutation();

    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: FileRejection[]) => {
            fileRejections.forEach((file) => {
                file.errors.forEach((error) => {
                    toast.error(error.message);
                });
            });

            if (acceptedFiles.length === 0) return;

            setFiles([...files, ...acceptedFiles]);
        },
        [files],
    );

    const { getInputProps, open } = useDropzone({
        onDrop,
        multiple: true,
        maxFiles: 10,
    });

    const handleClickDeleteFile = (_file: File) => {
        setFiles(files.filter((file) => file.name !== _file.name));
    };

    const handleClickAddComment = async () => {
        if (!data?.payload) return;
        if (commentary.length === 0) return;

        const issueId = data.payload.request.id;

        const newComment = {
            issueId: data.payload.request.id,
            text: commentary,
        };

        try {
            const comment = await createRequestComment(newComment).unwrap();
            setCommentary("");

            if (files.length > 0) {
                const formData = new FormData();

                for (const file of files) {
                    formData.append("files", file);
                }

                await uploadRequestCommentAttachments({
                    issueId,
                    commentId: comment.payload.id,
                    body: formData,
                }).unwrap();
                setFiles([]);
            }

            toast.success("Comment added successfully");
        } catch (error) {
            toastError(error);
        }
    };

    const handleClickResolveRequest = () => {
        const confirmed = confirm(
            "Are you sure you want to resolve the request?",
        );
        if (!confirmed) return;
        if (!id) return;

        resolveRequest(id)
            .unwrap()
            .then(() => {
                toast.success("Request successfully resolved");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const requestResolved = data?.payload?.request?.resolved;

    const canResolve =
        (profile.admin ||
            profile.hr ||
            profile.id === data?.payload?.created_by?.id) &&
        !requestResolved;

    if (isLoading) return <LinearProgress />;

    // @ts-ignore
    if (error && error.status === 404) return <NotFound />;

    return (
        <Box display="flex" gap={2} position="relative" alignItems="flex-start">
            <Box display="flex" flexDirection="column" gap={1} flex={3}>
                <Box alignSelf="flex-start">
                    <Link to="/help-center/requests">Requests</Link>
                </Box>

                {data?.payload?.service && (
                    <ServiceHeader
                        service={data?.payload?.service}
                        title={data?.payload?.request?.summary}
                        requestId={data?.payload?.request?.idReadable}
                    />
                )}

                <Divider flexItem />

                {data?.payload?.request?.description && (
                    <>
                        <Typography variant="h6">Description</Typography>
                        <Box data-color-mode="light">
                            <Box className="wmde-markdown-var"> </Box>
                            <MDEditor.Markdown
                                source={data.payload.request.description}
                                style={{ whiteSpace: "pre-wrap" }}
                            />
                        </Box>
                        <Divider flexItem />
                    </>
                )}

                {data?.payload?.request?.attachments &&
                    data.payload.request.attachments.length > 0 && (
                        <Box display="flex" flexDirection="column" gap={1}>
                            <Typography variant="h6">Attachments</Typography>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                                {data.payload.request.attachments.map(
                                    (attachment) => (
                                        <AttachmentCard
                                            key={attachment.id}
                                            attachment={attachment}
                                        />
                                    ),
                                )}
                            </Box>
                            <Divider flexItem />
                        </Box>
                    )}

                <Typography variant="h6">Write a comment</Typography>

                <Box display="flex" gap={1}>
                    <EmployeeAvatar
                        id={profile.id}
                        label={profile.english_name}
                        size={48}
                        fontSize={24}
                    />

                    <Box
                        data-color-mode="light"
                        display="flex"
                        flexDirection="column"
                        gap={1}
                        width="100%"
                    >
                        <Box className="wmde-markdown-var" mb={-1} />

                        <MDEditor
                            value={commentary}
                            onChange={(value) =>
                                setCommentary(value as unknown as string)
                            }
                            preview="edit"
                            previewOptions={{
                                rehypePlugins: [[rehypeSanitize]],
                            }}
                        />

                        <input {...getInputProps()} />

                        {files.length > 0 && (
                            <Box display="flex" gap={1} flexWrap="wrap">
                                {files.map((file) => (
                                    <FileCard
                                        key={file.name}
                                        file={file}
                                        onDelete={handleClickDeleteFile}
                                    />
                                ))}
                            </Box>
                        )}

                        <Box display="flex" gap={1}>
                            <LoadingButton
                                onClick={handleClickAddComment}
                                disabled={commentary.length === 0}
                                loading={
                                    createCommentProps.isLoading ||
                                    uploadCommentAttachmentsProps.isLoading
                                }
                                variant="outlined"
                                size="small"
                            >
                                Add comment
                            </LoadingButton>
                            <Button
                                onClick={open}
                                variant="outlined"
                                size="small"
                                startIcon={<AttachFileIcon />}
                            >
                                Attach file
                            </Button>
                        </Box>
                    </Box>
                </Box>

                <Divider flexItem />

                {data?.payload?.request?.comments &&
                data.payload.request.comments.length > 0 ? (
                    <>
                        <Typography variant="h6">Activity</Typography>
                        <Divider flexItem />

                        <Box display="flex" flexDirection="column" gap={1}>
                            {data?.payload?.request?.comments?.map(
                                (comment, index) => (
                                    <Fragment key={comment.id}>
                                        <RequestComment comment={comment} />
                                        {index !==
                                            data.payload.request.comments
                                                .length -
                                                1 && <Divider flexItem />}
                                    </Fragment>
                                ),
                            )}
                        </Box>
                    </>
                ) : (
                    <Typography variant="h6">No activites</Typography>
                )}
            </Box>

            <Box
                display="flex"
                alignItems="flex-start"
                flexDirection="column"
                gap={1}
                flex={1}
                position="sticky"
                top={0}
                p={1}
                border="1px solid #ccc"
                borderRadius={1}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontSize={14} fontWeight={500}>
                        Status:
                    </Typography>
                    <Chip
                        label={
                            data?.payload?.request?.customFields?.find(
                                (cf) => cf.name === "State",
                            )?.value?.name
                        }
                        size="small"
                    />
                </Box>

                {data?.payload?.request?.reporter &&
                    data?.payload?.request?.created && (
                        <UserDateInfo
                            label="Created by"
                            user={data.payload.request.reporter}
                            date={data.payload.request.created}
                        />
                    )}
                {data?.payload?.request?.updater &&
                    data?.payload?.request?.updated && (
                        <UserDateInfo
                            label="Updated by"
                            user={data.payload.request.updater}
                            date={data.payload.request.updated}
                        />
                    )}

                {canResolve && (
                    <Box display="flex" gap={1}>
                        <LoadingButton
                            onClick={handleClickResolveRequest}
                            variant="outlined"
                            size="small"
                            color="info"
                            loading={resolveRequestProps.isLoading}
                        >
                            Resolve
                        </LoadingButton>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default RequestView;
