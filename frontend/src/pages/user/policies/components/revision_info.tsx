import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import { Employee } from "_components";
import { FC } from "react";
import { PolicyRevisionT } from "types";
import { formatDateHumanReadable } from "utils/convert";

interface IRevisionInfoProps {
    revision: PolicyRevisionT;
}

const RevisionInfo: FC<IRevisionInfoProps> = ({ revision }) => {
    return (
        <Box display="flex" alignItems="center" fontSize={14}>
            {revision.created_by && (
                <Box display="flex" alignItems="center">
                    <Typography fontSize="inherit">
                        Created by:&nbsp;
                    </Typography>
                    <Employee employee={revision.created_by} />
                </Box>
            )}

            {revision.updated_by && (
                <Box display="flex" alignItems="center">
                    <Typography fontSize="inherit">
                        , updated by:&nbsp;
                    </Typography>
                    <Employee employee={revision.updated_by} />
                </Box>
            )}

            {revision.updated && (
                <Typography fontSize="inherit">
                    &nbsp;
                    {formatDateHumanReadable(revision.updated)}
                </Typography>
            )}
        </Box>
    );
};

export default RevisionInfo;
