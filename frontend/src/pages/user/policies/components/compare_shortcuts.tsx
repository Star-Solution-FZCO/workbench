import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import DifferenceIcon from "@mui/icons-material/Difference";
import { Button } from "@mui/material";
import { CircularLoading } from "_components/progress";
import { policiesApi } from "_redux";
import { FC } from "react";
import { useNavigate } from "react-router";
import { createSearchParams } from "react-router-dom";
import { PolicyRevisionT, PolicyT } from "types";

interface ICompareShorcutsProps {
    policy: PolicyT;
    revision: PolicyRevisionT;
}

const CompareShortcuts: FC<ICompareShorcutsProps> = ({ policy, revision }) => {
    const navigate = useNavigate();

    const { data: revisions, isLoading } =
        policiesApi.useListPolicyRevisionQuery({
            policy_id: policy.id,
        });

    const revisionIndex = revisions?.payload?.items?.findIndex(
        (r) => r.policy_revision === revision.policy_revision,
    );

    const showPrevious = revisionIndex !== 0;
    const showCurrent =
        policy.current_revision &&
        policy.current_revision !== revision.policy_revision;

    const compare = (prev: number, curr: number) => {
        const [rev_old, rev_new] = [prev, curr].sort((a, b) => a - b);

        const params = {
            rev_old: rev_old.toString(),
            rev_new: rev_new.toString(),
        };

        navigate({
            pathname: `/policies/diff/${policy.id}`,
            search: createSearchParams(params).toString(),
        });
    };

    const compareWithPrevious = () => {
        if (!revisions || !revisionIndex) return;
        if (revisionIndex === -1) return;

        const prevRevision = revisions.payload.items[revisionIndex - 1];
        compare(prevRevision.policy_revision, revision.policy_revision);
    };

    const compareWithCurrent = () => {
        if (!policy.current_revision) return;

        compare(revision.policy_revision, policy.current_revision);
    };

    if (isLoading) return <CircularLoading />;

    return (
        <>
            {showPrevious && (
                <Button
                    variant="outlined"
                    color="info"
                    size="small"
                    startIcon={<DifferenceIcon />}
                    onClick={compareWithPrevious}
                >
                    Compare with previous revision
                </Button>
            )}
            {showCurrent && (
                <Button
                    variant="outlined"
                    color="info"
                    size="small"
                    startIcon={<CompareArrowsIcon />}
                    onClick={compareWithCurrent}
                >
                    Compare with current revision
                </Button>
            )}
        </>
    );
};

export { CompareShortcuts };
