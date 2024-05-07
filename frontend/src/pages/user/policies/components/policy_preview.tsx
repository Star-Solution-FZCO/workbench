import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, IconButton, Typography } from "@mui/material";
import { ParsedHTMLContent } from "_components";
import { useAppSelector } from "_redux";
import { FC } from "react";
import { PolicyRevisionT } from "types";
import RevisionInfo from "./revision_info";

interface IPolicyPreviewProps {
    name: string;
    text: string;
    onBack: () => void;
}

const PolicyPreview: FC<IPolicyPreviewProps> = ({ name, text, onBack }) => {
    const profile = useAppSelector((state) => state.profile.payload);

    const mockRevision: PolicyRevisionT = {
        count_approved: 0,
        count_unapproved: 0,
        created: "",
        created_by: { ...profile, pararam: null },
        policy_id: 0,
        policy_revision: 0,
        published: null,
        published_by: null,
        text: "",
        updated: new Date().toISOString(),
        updated_by: { ...profile, pararam: null },
    };

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <IconButton onClick={onBack}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography fontWeight={500} fontSize={20}>
                        {name}
                    </Typography>
                </Box>

                <Box display="flex" gap={1}></Box>
            </Box>

            <Box flex={1}>
                <Box display="flex" flexDirection="column" gap={1}>
                    <RevisionInfo revision={mockRevision} />

                    <ParsedHTMLContent text={text} />
                </Box>
            </Box>
        </Box>
    );
};

export default PolicyPreview;
