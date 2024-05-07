import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    IconButton,
    LinearProgress,
    TextField,
    Typography,
} from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { ReduxSelect, RichTextEditor } from "_components";
import { policiesApi, useAppSelector } from "_redux";
import { FC, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { SelectOptionT } from "types";
import { toastError } from "utils";
import { formatDateHumanReadable } from "utils/convert";
import { CompareShortcuts } from "../components";
import RevisionInfo from "../components/revision_info";

const RevisionView: FC = () => {
    const navigate = useNavigate();
    const { id, revision_id } = useParams();

    const isAdmin = useAppSelector((state) => state.profile.payload.admin);

    const { data: policy } = policiesApi.useGetPolicyQuery(Number(id));
    const { data: revision } = policiesApi.useGetPolicyRevisionQuery(
        { policy_id: policy?.payload?.id!, revision_id: Number(revision_id) },
        { skip: !policy },
    );

    const [quiz, setQuiz] = useState<SelectOptionT | null>(null);
    const [nameEditMode, setNameEditMode] = useState(false);

    const nameInputRef = useRef<HTMLInputElement>(null);

    const { register, reset, getValues, setValue } = useForm({
        mode: "onBlur",
        defaultValues: {
            name: policy?.payload?.name || "",
            text: revision?.payload?.text || "",
        },
    });

    const [createPolicyRevision, createPolicyRevisionProps] =
        policiesApi.useCreatePolicyRevisionMutation();
    const [updatePolicy] = policiesApi.useUpdatePolicyMutation();

    const enableNameEditMode = () => {
        setNameEditMode(true);
        nameInputRef.current?.focus();
    };

    const savePolicyName = () => {
        if (!getValues("name")) return;

        updatePolicy({
            id: Number(id),
            name: getValues("name"),
        })
            .unwrap()
            .then(() => {
                setNameEditMode(false);
                toast.success("Policy name has been successfully saved");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleChangeQuiz = (option: SelectOptionT | null) => {
        setQuiz(option);

        const quiz_id = option ? (option.value as number) : null;

        updatePolicy({
            id: Number(id),
            quiz_id,
        })
            .unwrap()
            .then(() => {
                setNameEditMode(false);
                toast.success("Policy quiz has been successfully changed");
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
            .then((revisionData) => {
                const { policy_id, policy_revision } = revisionData;
                navigate(
                    `/policies/view/${policy_id}/revisions/${policy_revision}/edit`,
                );
            })
            .catch((error) => {
                toastError(error);
            });
    };

    useEffect(() => {
        if (policy && revision) {
            reset({ name: policy.payload.name, text: revision.payload.text });
            setQuiz(policy.payload.quiz);
        }
    }, [policy, revision, reset]);

    if (!policy && !revision) return <LinearProgress />;

    return (
        <Box display="flex" flexDirection="column" height="100%" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <IconButton onClick={() => navigate(-1)}>
                    <ArrowBackIcon />
                </IconButton>

                <Typography fontWeight={500} fontSize={20}>
                    {policy?.payload?.canceled
                        ? `Policy "${policy?.payload?.name}" canceled - Read only mode`
                        : policy?.payload?.name}
                </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
                <TextField
                    inputRef={nameInputRef}
                    {...register("name")}
                    label="Policy name"
                    InputProps={{
                        readOnly: !nameEditMode || !isAdmin,
                        endAdornment: nameEditMode ? (
                            <Box display="flex" alignItems="center">
                                <IconButton
                                    onClick={savePolicyName}
                                    color="success"
                                    size="small"
                                    disabled={!getValues("name")}
                                >
                                    <CheckIcon />
                                </IconButton>
                                <IconButton
                                    onClick={() => setNameEditMode(false)}
                                    color="error"
                                    size="small"
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        ) : (
                            <IconButton
                                onClick={enableNameEditMode}
                                color="info"
                                size="small"
                                disabled={!isAdmin}
                            >
                                <EditIcon />
                            </IconButton>
                        ),
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            savePolicyName();
                        }
                    }}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                />

                <Box width="400px">
                    <ReduxSelect
                        key={nanoid()}
                        label="Quiz"
                        value={quiz}
                        onChange={handleChangeQuiz}
                        optionsLoadFn={policiesApi.useListQuizSelectQuery}
                        isClearable
                    />
                </Box>
            </Box>

            {revision?.payload && <RevisionInfo revision={revision.payload} />}

            <Box flex={1} overflow="hidden">
                <RichTextEditor
                    data={getValues("text")}
                    onChange={(value) => setValue("text", value)}
                    readOnly
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
                <Box>
                    <Typography fontWeight={500}>
                        Revision: {revision?.payload.policy_revision}
                        {revision?.payload?.published &&
                            `, published: ${formatDateHumanReadable(
                                revision.payload.published,
                            )}`}
                    </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                    {policy && revision && (
                        <CompareShortcuts
                            policy={policy.payload}
                            revision={revision?.payload}
                        />
                    )}

                    {isAdmin && (
                        <LoadingButton
                            onClick={createNewRevision}
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                            disabled={!!policy?.payload?.canceled}
                            loading={createPolicyRevisionProps.isLoading}
                        >
                            Create new revision
                        </LoadingButton>
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

export default RevisionView;
