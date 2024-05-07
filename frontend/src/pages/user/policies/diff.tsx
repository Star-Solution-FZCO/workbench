import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import {
    Box,
    Button,
    Divider,
    LinearProgress,
    Typography,
} from "@mui/material";
import { Employee, ParsedHTMLContent } from "_components";
import { policiesApi, useAppSelector } from "_redux";
import { decode } from "html-entities";
import { FC, useEffect } from "react";
import {
    Link,
    createSearchParams,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";
import { PolicyRevisionT } from "types";
import { formatDateHumanReadable } from "utils/convert";

interface IPolicyRevisionCardProps {
    revision: PolicyRevisionT;
    current?: boolean;
}

const PolicyRevisionCard: FC<IPolicyRevisionCardProps> = ({
    revision,
    current,
}) => {
    const isAdmin = useAppSelector((state) => state.profile.payload.admin);
    const path = isAdmin ? (revision.published ? "view" : "edit") : "view";

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            bgcolor="#f0f0f0"
            gap={1}
            p={1}
            borderRadius={1}
        >
            <Link
                to={`/policies/view/${revision.policy_id}/revisions/${revision.policy_revision}/${path}`}
            >
                <Typography fontSize={18}>
                    {current
                        ? `Current (${revision.policy_revision})`
                        : revision.policy_revision}
                </Typography>
            </Link>

            {revision.created_by && <Employee employee={revision.created_by} />}

            <Typography fontSize={14} alignSelf="flex-start" ml="28px">
                {formatDateHumanReadable(
                    revision.updated ? revision.updated : revision.created,
                )}
            </Typography>
        </Box>
    );
};

const PolicyDiff = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();

    if (!id) navigate("..");

    const oldRevisionId = searchParams.get("rev_old");
    const newRevisionId = searchParams.get("rev_new");

    const { data: policy, isLoading: policyLoading } =
        policiesApi.useGetPolicyQuery(Number(id));
    const { data: oldRevision, isLoading: oldRevisionLoading } =
        policiesApi.useGetPolicyRevisionQuery(
            {
                policy_id: policy?.payload?.id!,
                revision_id: Number(oldRevisionId),
            },
            { skip: !policy },
        );
    const { data: newRevision, isLoading: newRevisionLoading } =
        policiesApi.useGetPolicyRevisionQuery(
            {
                policy_id: policy?.payload?.id!,
                revision_id: Number(newRevisionId),
            },
            { skip: !policy },
        );

    const [
        getPolicyDiff,
        { data: diff, isLoading: diffLoading, isFetching: diffFetching },
    ] = policiesApi.useLazyGetPolicyDiffQuery();

    const compare = (prev: number, curr: number) => {
        if (!policy) return;

        const [rev_old, rev_new] = [prev, curr].sort((a, b) => a - b);

        const params = {
            rev_old: rev_old.toString(),
            rev_new: rev_new.toString(),
        };

        navigate({
            pathname: `/policies/diff/${policy.payload.id}`,
            search: createSearchParams(params).toString(),
        });
    };

    const handleClickPrev = () => {
        if (!oldRevision) return;
        compare(
            oldRevision.payload.policy_revision - 1,
            oldRevision.payload.policy_revision,
        );
    };

    const handleClickNext = () => {
        if (!newRevision) return;
        compare(
            newRevision.payload.policy_revision,
            newRevision.payload.policy_revision + 1,
        );
    };

    const showPrevious = oldRevision?.payload.policy_revision !== 1;
    const showNext =
        policy?.payload?.current_revision &&
        newRevision?.payload?.policy_revision &&
        policy.payload.current_revision >= newRevision.payload.policy_revision;

    useEffect(() => {
        if (!oldRevisionId || !oldRevisionId) return;

        getPolicyDiff({
            policy_id: Number(id),
            rev_old: Number(oldRevisionId),
            rev_new: Number(newRevisionId),
        });
    }, [id, oldRevisionId, newRevisionId, getPolicyDiff]);

    if (
        policyLoading ||
        oldRevisionLoading ||
        newRevisionLoading ||
        diffLoading
    )
        return <LinearProgress />;

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Typography variant="h5">
                Policy history - {policy?.payload?.name}
            </Typography>

            <Box display="flex" justifyContent="space-between">
                <Box display="flex" flexDirection="column" gap={1}>
                    <Typography variant="h6">Revision comparison</Typography>

                    <Box display="flex" gap={1}>
                        {showPrevious && (
                            <Button
                                onClick={handleClickPrev}
                                variant="outlined"
                                size="small"
                                color="info"
                            >
                                <ArrowLeftIcon />
                            </Button>
                        )}

                        {oldRevision && (
                            <PolicyRevisionCard
                                revision={oldRevision.payload}
                                current={
                                    oldRevision.payload.policy_revision ===
                                    policy?.payload.current_revision
                                }
                            />
                        )}

                        {newRevision && (
                            <PolicyRevisionCard
                                revision={newRevision.payload}
                                current={
                                    newRevision.payload.policy_revision ===
                                    policy?.payload.current_revision
                                }
                            />
                        )}

                        {showNext && (
                            <Button
                                onClick={handleClickNext}
                                variant="outlined"
                                size="small"
                                color="info"
                            >
                                <ArrowRightIcon />
                            </Button>
                        )}
                    </Box>
                </Box>

                <Box display="flex" flexDirection="column">
                    <Typography fontWeight={500}>Legend</Typography>
                    <ins style={{ background: "rgb(230, 255, 230)" }}>
                        This content has been added.
                    </ins>
                    <del style={{ background: "rgb(255, 230, 230)" }}>
                        This content has been deleted.
                    </del>
                </Box>
            </Box>

            <Link to={`/policies/view/${id}/revisions`}>
                View policy revisions
            </Link>

            <Divider flexItem />

            <Box minHeight="4px">{diffFetching && <LinearProgress />}</Box>

            {diff && <ParsedHTMLContent text={decode(diff.text)} />}
        </Box>
    );
};

export default PolicyDiff;
