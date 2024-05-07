import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { Box, IconButton, LinearProgress, Typography } from "@mui/material";
import { ParsedHTMLContent } from "_components";
import { sharedApi, useAppSelector } from "_redux";
import { useNavigate, useParams } from "react-router-dom";
import { formatDateHumanReadable } from "utils/convert";

const ChangelogView = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const isAdmin = useAppSelector((state) => state.profile.payload.admin);

    const { data, isLoading } = sharedApi.useGetChangelogQuery(Number(id), {
        skip: !id,
    });

    if (isLoading) return <LinearProgress />;

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <IconButton onClick={() => navigate("..")}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5">
                    Changelog: {data?.payload?.name} (
                    {data?.payload?.release_date
                        ? formatDateHumanReadable(data.payload.release_date)
                        : "RC"}
                    )
                </Typography>

                {isAdmin && (
                    <IconButton onClick={() => navigate(`edit`)}>
                        <EditIcon />
                    </IconButton>
                )}
            </Box>

            <ParsedHTMLContent text={data?.payload?.content || ""} />
        </Box>
    );
};

export default ChangelogView;
