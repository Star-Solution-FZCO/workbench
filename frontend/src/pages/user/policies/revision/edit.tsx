import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import PreviewIcon from "@mui/icons-material/Preview";
import PublishIcon from "@mui/icons-material/Publish";
import SaveIcon from "@mui/icons-material/Save";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    IconButton,
    LinearProgress,
    TextField,
    Typography,
} from "@mui/material";
import { RichTextEditor } from "_components";
import { policiesApi, useAppSelector } from "_redux";
import { FC, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { toastError } from "utils";
import { CompareShortcuts } from "../components";
import PolicyPreview from "../components/policy_preview";
import RevisionInfo from "../components/revision_info";

const EditPolicy: FC = () => {
    const navigate = useNavigate();
    const { id, revision_id } = useParams();

    const isAdmin = useAppSelector((state) => state.profile.payload.admin);

    const { data: policy } = policiesApi.useGetPolicyQuery(Number(id));
    const { data: revision } = policiesApi.useGetPolicyRevisionQuery(
        { policy_id: policy?.payload?.id!, revision_id: Number(revision_id) },
        { skip: !policy },
    );

    const [preview, setPreview] = useState(false);
    const [saved, setSaved] = useState(true);

    const {
        register,
        getValues,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm({
        mode: "onBlur",
        defaultValues: {
            name: policy?.payload?.name || "",
            text: revision?.payload?.text || "",
        },
    });

    const [updatePolicy, updatePolicyProps] =
        policiesApi.useUpdatePolicyMutation();
    const [createPolicyRevision, createPolicyRevisionProps] =
        policiesApi.useCreatePolicyRevisionMutation();
    const [updatePolicyRevision, updatePolicyRevisionProps] =
        policiesApi.useUpdatePolicyRevisionMutation();
    const [publishPolicyRevision, publishPolicyRevisionProps] =
        policiesApi.usePublishPolicyRevisionMutation();

    const updateRevision = () => {
        updatePolicyRevision({
            policy_id: Number(id),
            revision_id: Number(revision_id),
            text: getValues("text"),
        })
            .unwrap()
            .then(() => {
                toast.success("Policy was successfully updated");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const createNewRevision = () => {
        createPolicyRevision({
            policy_id: Number(id),
            text: getValues("text"),
        })
            .unwrap()
            .then(() => {
                toast.success("Policy was successfully updated");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const save = () => {
        if (!id && !revision_id) return;

        updatePolicy({
            id: Number(id),
            name: getValues("name"),
        })
            .unwrap()
            .then(() => {
                revision?.payload.published
                    ? createNewRevision()
                    : updateRevision();
                setSaved(true);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const publish = useCallback(() => {
        if (!id && !revision_id) return;
        if (!saved) {
            alert(
                "You want to publish a revision, but there are unsaved changes, save the changes before publishing revision",
            );
            return;
        }

        publishPolicyRevision({
            policy_id: Number(id),
            revision_id: Number(revision_id),
        })
            .unwrap()
            .then(() => {
                navigate("..");
                toast.success("Policy was successfully published");
            })
            .catch((error) => {
                toastError(error);
            });
    }, [id, navigate, publishPolicyRevision, revision_id, saved]);

    useEffect(() => {
        if (policy && revision) {
            reset({ name: policy.payload.name, text: revision.payload.text });
        }
    }, [policy, revision, reset]);

    useEffect(() => {
        const subscription = watch(() => setSaved(false));
        return () => subscription.unsubscribe();
    }, [watch]);

    if (!policy && !revision) return <LinearProgress />;

    if (preview)
        return (
            <PolicyPreview
                name={getValues("name")}
                text={getValues("text")}
                onBack={() => setPreview(false)}
            />
        );

    return (
        <Box display="flex" flexDirection="column" height="100%" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <IconButton onClick={() => navigate(-1)}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">
                    {policy?.payload?.canceled
                        ? "Policy canceled - Read only mode"
                        : revision?.payload.published
                          ? "Create new policy revision"
                          : "Edit policy"}
                </Typography>
            </Box>

            <TextField
                {...register("name", {
                    required: "Required field",
                })}
                label="Policy name"
                error={!!errors.name}
                helperText={errors.name?.message}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                    readOnly: !!policy?.payload?.canceled || !isAdmin,
                }}
                fullWidth
            />

            {revision?.payload && <RevisionInfo revision={revision.payload} />}

            <Box flex={1} overflow="hidden">
                <RichTextEditor
                    data={getValues("text")}
                    onChange={(value) => setValue("text", value)}
                    readOnly={!!policy?.payload?.canceled || !isAdmin}
                />
            </Box>

            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                padding={1}
                border={1}
                borderColor="divider"
                borderRadius={1}
            >
                <Typography fontWeight={500}>
                    Revision: {revision?.payload.policy_revision}
                </Typography>

                <Box display="flex" alignItems="center" gap={1}>
                    {policy && revision && (
                        <CompareShortcuts
                            policy={policy.payload}
                            revision={revision?.payload}
                        />
                    )}

                    {isAdmin && (
                        <>
                            <Button
                                variant="outlined"
                                color="info"
                                size="small"
                                startIcon={<PreviewIcon />}
                                onClick={() => setPreview(true)}
                                disabled={!watch("name") || !watch("text")}
                            >
                                Preview
                            </Button>

                            <LoadingButton
                                onClick={publish}
                                variant="outlined"
                                color="secondary"
                                size="small"
                                startIcon={<PublishIcon />}
                                loading={publishPolicyRevisionProps.isLoading}
                                disabled={
                                    !watch("text") ||
                                    !!errors.name ||
                                    !!revision?.payload?.published
                                }
                            >
                                Publish
                            </LoadingButton>

                            <LoadingButton
                                onClick={save}
                                variant="outlined"
                                size="small"
                                startIcon={<SaveIcon />}
                                loading={
                                    updatePolicyProps.isLoading ||
                                    updatePolicyRevisionProps.isLoading ||
                                    createPolicyRevisionProps.isLoading
                                }
                                disabled={
                                    !watch("text") ||
                                    !!errors.name ||
                                    !!policy?.payload?.canceled
                                }
                            >
                                {revision?.payload.published
                                    ? "Create new revision"
                                    : "Save"}
                            </LoadingButton>
                        </>
                    )}

                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<CloseIcon />}
                        onClick={() => navigate(-1)}
                    >
                        Close
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default EditPolicy;
