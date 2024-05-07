import EditIcon from "@mui/icons-material/Edit";
import { Box, Divider, IconButton, Typography } from "@mui/material";
import { ParsedHTMLContent } from "_components";
import { useAppSelector } from "_redux";
import { FC } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChangelogT } from "types";
import { formatDateHumanReadable } from "utils/convert";

interface IChangelogProps {
    changelog: ChangelogT;
}

const Changelog: FC<IChangelogProps> = ({ changelog }) => {
    const navigate = useNavigate();
    const isAdmin = useAppSelector((state) => state.profile.payload.admin);

    return (
        <Box
            id={changelog.id.toString()}
            width="100%"
            display="flex"
            alignItems="flex-start"
            flexDirection="column"
            gap={1}
            border="1px solid #ccc"
            borderRadius={1}
            p={1}
        >
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
                width="100%"
            >
                <Link to={changelog.id.toString()}>
                    <Typography fontWeight={700} fontSize={20}>
                        {changelog.name} (
                        {changelog.release_date
                            ? formatDateHumanReadable(changelog.release_date)
                            : "RC"}
                        )
                    </Typography>
                </Link>

                {isAdmin && (
                    <IconButton
                        sx={{ p: 0 }}
                        onClick={() => navigate(`${changelog.id}/edit`)}
                    >
                        <EditIcon />
                    </IconButton>
                )}
            </Box>

            <Divider flexItem />
            <ParsedHTMLContent text={changelog.content} />
        </Box>
    );
};

export { Changelog };
