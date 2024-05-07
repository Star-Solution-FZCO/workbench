import { Chip } from "@mui/material";
import { FC } from "react";
import { SelectTagOptionT } from "types";
import { getContrastColorHex } from "utils/convert";

interface ITeamTagProps {
    tag: SelectTagOptionT;
    onClick?: () => void;
    small?: boolean;
}

const TeamTag: FC<ITeamTagProps> = ({ tag, onClick, small }) => {
    return (
        <Chip
            sx={{
                height: small ? "24px" : undefined,
                bgcolor: tag.color,
                color: tag.color && getContrastColorHex(tag.color),
                "&:hover": {
                    bgcolor: tag.color ? tag.color + " !important" : undefined,
                },
            }}
            label={tag.label}
            variant="outlined"
            onClick={(e) => {
                e.stopPropagation();
                onClick && onClick();
            }}
        />
    );
};

export { TeamTag };
