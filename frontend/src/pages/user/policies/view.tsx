import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import ListIcon from "@mui/icons-material/List";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    IconButton,
    LinearProgress,
    Typography,
} from "@mui/material";
import { policiesApi, useAppSelector } from "_redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { toastError } from "utils";
import { formatDateHumanReadable } from "utils/convert";
import {
    CancelPolicy,
    CompareShortcuts,
    PolicyContent,
    RevisionEmployeeList,
} from "./components";

const PolicyView = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    if (!id) navigate("..");

    const isAdmin = useAppSelector((state) => state.profile.payload.admin);

    const { data: policy } = policiesApi.useGetPolicyQuery(Number(id));
    const { data: currentRevision } = policiesApi.useGetPolicyRevisionQuery(
        {
            policy_id: policy?.payload?.id || -1,
            revision_id: policy?.payload?.current_revision || -1,
        },
        { skip: !policy },
    );
    const { data: revisions } = policiesApi.useListPolicyRevisionQuery({
        policy_id: Number(id),
    });

    const [approvePolicy, approvePolicyProps] =
        policiesApi.useApprovePolicyMutation();

    const handleClickEdit = () => {
        const revisionId =
            policy?.payload?.current_revision ||
            revisions?.payload?.items.at(-1)?.policy_revision;

        const path = policy?.payload?.current_revision ? "view" : "edit";
        navigate(`revisions/${revisionId}/${path}`);
    };

    const approve = () => {
        if (!policy) return;

        if (policy.payload.quiz && !policy.payload.quiz_passed) {
            const confirmed = confirm(
                "You need to pass the quiz to agree the policy. Ready to do the quiz?",
            );

            if (!confirmed) return;
            navigate(`/quizzes/${policy.payload.quiz.value}/take`, {
                state: {
                    policy: policy.payload,
                },
            });
            return;
        }

        approvePolicy(policy.payload.id)
            .unwrap()
            .then(() => {
                toast.success("Policy agreed");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    if (!policy) return <LinearProgress />;

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <IconButton onClick={() => navigate(-1)}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography fontWeight={500} fontSize={20}>
                        {policy?.payload?.name}
                    </Typography>
                </Box>

                <Box display="flex" gap={1}>
                    {policy && currentRevision && (
                        <CompareShortcuts
                            policy={policy.payload}
                            revision={currentRevision.payload}
                        />
                    )}

                    {policy?.payload?.current_revision && (
                        <RevisionEmployeeList
                            policy_id={Number(id)}
                            revision_id={policy.payload.current_revision}
                            policy_name={policy.payload.name}
                        />
                    )}

                    {isAdmin && (
                        <>
                            <Button
                                variant="outlined"
                                color="secondary"
                                size="small"
                                startIcon={<ListIcon />}
                                onClick={() => navigate("revisions")}
                            >
                                View policy revision list
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={handleClickEdit}
                            >
                                Edit
                            </Button>
                            <CancelPolicy
                                policy_id={policy.payload.id}
                                disabled={!!policy.payload.canceled}
                            />
                        </>
                    )}
                </Box>
            </Box>

            <Box flex={1}>
                {policy?.payload && <PolicyContent policy={policy.payload} />}
            </Box>

            <Box display="flex" alignItems="center" gap={1} py={1}>
                {policy.payload.can_approve && (
                    <LoadingButton
                        onClick={approve}
                        variant="outlined"
                        loading={approvePolicyProps.isLoading}
                    >
                        Agree
                    </LoadingButton>
                )}

                {policy.payload.approved && (
                    <Typography fontWeight={500}>
                        Agreed:{" "}
                        {formatDateHumanReadable(policy.payload.approved)}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default PolicyView;
