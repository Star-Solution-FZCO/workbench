import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { LoadingButton } from "@mui/lab";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { RichTextEditor } from "_components";
import { policiesApi } from "_redux";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { toastError } from "utils";
import PolicyPreview from "./components/policy_preview";

const CreatePolicy: FC = () => {
    const navigate = useNavigate();

    const [policyId, setPolicyId] = useState<number | null>(null);
    const [revisionId, setRevisionId] = useState<number | null>(null);
    const [firstSave, setFirstSave] = useState(true);
    const [preview, setPreview] = useState(false);

    const {
        register,
        getValues,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        mode: "onBlur",
        defaultValues: {
            name: "",
            text: "",
        },
    });

    const [createPolicy, createPolicyProps] =
        policiesApi.useCreatePolicyMutation();
    const [createPolicyRevision, createPolicyRevisionProps] =
        policiesApi.useCreatePolicyRevisionMutation();

    const [updatePolicy, updatePolicyProps] =
        policiesApi.useUpdatePolicyMutation();
    const [updatePolicyRevision, updatePolicyRevisionProps] =
        policiesApi.useUpdatePolicyRevisionMutation();

    const [publishPolicyRevision, publishPolicyRevisionProps] =
        policiesApi.usePublishPolicyRevisionMutation();

    const handleFirstSave = () => {
        createPolicy({
            name: getValues("name"),
        })
            .unwrap()
            .then((policyData) => {
                createPolicyRevision({
                    policy_id: policyData.payload.id,
                    text: getValues("text"),
                })
                    .unwrap()
                    .then((revisionData) => {
                        setPolicyId(revisionData.policy_id);
                        setRevisionId(revisionData.policy_revision);
                        setFirstSave(false);
                        toast.success("Policy was successfully saved");
                    })
                    .catch((error) => {
                        toastError(error);
                    });
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleResave = () => {
        if (!policyId && !revisionId) return;

        updatePolicy({
            id: policyId!,
            name: getValues("name"),
        })
            .unwrap()
            .then(() => {
                updatePolicyRevision({
                    policy_id: policyId!,
                    revision_id: revisionId!,
                    text: getValues("text"),
                })
                    .unwrap()
                    .then(() => {
                        toast.success("Policy was successfully updated");
                    })
                    .catch((error) => {
                        toastError(error);
                    });
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const save = () => {
        if (firstSave) {
            handleFirstSave();
        } else {
            handleResave();
        }
    };

    const publish = () => {
        if (!policyId && !revisionId) return;

        publishPolicyRevision({
            policy_id: policyId!,
            revision_id: revisionId!,
        })
            .unwrap()
            .then(() => {
                navigate(-1);
                toast.success("Policy was successfully published");
            })
            .catch((error) => {
                toastError(error);
            });
    };

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
                <IconButton onClick={() => navigate("..")}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">Create policy</Typography>
            </Box>

            <TextField
                {...register("name", {
                    required: "Required field",
                })}
                label="Policy name"
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
            />

            <Box flex={1} overflow="hidden">
                <RichTextEditor
                    data={getValues("text")}
                    onChange={(value) => setValue("text", value)}
                />
            </Box>

            <Box
                display="flex"
                justifyContent="flex-end"
                gap={1}
                padding={1}
                border={1}
                borderColor="divider"
                borderRadius={1}
            >
                <Button
                    onClick={() => setPreview(true)}
                    variant="outlined"
                    color="info"
                    size="small"
                    disabled={!watch("name") || !watch("text")}
                >
                    Preview
                </Button>

                <LoadingButton
                    onClick={publish}
                    variant="outlined"
                    color="secondary"
                    size="small"
                    loading={publishPolicyRevisionProps.isLoading}
                    disabled={
                        !watch("text") ||
                        !!errors.name ||
                        !policyId ||
                        !revisionId
                    }
                >
                    Publish
                </LoadingButton>

                <LoadingButton
                    onClick={save}
                    variant="outlined"
                    size="small"
                    loading={
                        createPolicyProps.isLoading ||
                        createPolicyRevisionProps.isLoading ||
                        updatePolicyProps.isLoading ||
                        updatePolicyRevisionProps.isLoading
                    }
                    disabled={!watch("text") || !!errors.name}
                >
                    Save
                </LoadingButton>

                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => navigate("..")}
                >
                    Close
                </Button>
            </Box>
        </Box>
    );
};

export default CreatePolicy;
