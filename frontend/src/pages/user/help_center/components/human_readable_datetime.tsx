import { Tooltip, Typography } from "@mui/material";
import { differenceInHours } from "date-fns";
import { FC } from "react";
import {
    formatDateDiffHumanReadable,
    formatDateTimeHumanReadable,
} from "utils/convert";

interface IHumanReadableDateTime {
    date: number;
}

const HumanReadableDateTime: FC<IHumanReadableDateTime> = ({ date }) => {
    const diffInHours = differenceInHours(new Date(), new Date(date));

    return diffInHours >= 24 ? (
        <Typography fontSize="inherit" display="inline">
            {formatDateTimeHumanReadable(new Date(date))}
        </Typography>
    ) : (
        <Tooltip
            title={formatDateTimeHumanReadable(new Date(date))}
            placement="top"
        >
            <Typography fontSize="inherit" display="inline">
                {formatDateDiffHumanReadable(new Date(date), new Date())}
            </Typography>
        </Tooltip>
    );
};

export { HumanReadableDateTime };
