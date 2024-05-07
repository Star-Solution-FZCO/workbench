import { Box, Typography } from "@mui/material";
import { ParsedHTMLContent } from "_components";
import { policiesApi } from "_redux";
import { FC } from "react";
import { PolicyT } from "types";
import RevisionInfo from "../revision_info";

interface IPolicyContentProps {
    policy: PolicyT;
}

const PolicyContent: FC<IPolicyContentProps> = ({ policy }) => {
    const { data } = policiesApi.useGetPolicyRevisionQuery(
        {
            policy_id: policy.id,
            revision_id: policy.current_revision!,
        },
        { skip: !policy.current_revision },
    );

    if (!policy.current_revision)
        return <Typography fontWeight={500}>No content policy</Typography>;

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            {data?.payload && <RevisionInfo revision={data.payload} />}
            {data?.payload?.text && (
                <ParsedHTMLContent text={data.payload.text} />
            )}
        </Box>
    );
};

export { PolicyContent };
