import AddIcon from "@mui/icons-material/Add";
import { Box, Button, LinearProgress, Typography } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { sharedApi, useAppSelector } from "_redux";
import { Link, useNavigate } from "react-router-dom";

const Menu = () => {
    const navigate = useNavigate();
    const isAdmin = useAppSelector((state) => state.profile.payload.admin);

    const { data, isLoading } = sharedApi.useListChangelogNameQuery();

    return (
        <Box
            position="sticky"
            top={0}
            display="flex"
            flexDirection="column"
            flex={1}
            gap={1}
            height="fit-content"
        >
            {isAdmin && (
                <Button
                    sx={{ height: "40px" }}
                    onClick={() => navigate("create")}
                    startIcon={<AddIcon />}
                    variant="outlined"
                    color="secondary"
                    fullWidth
                >
                    Add changelog
                </Button>
            )}

            {data?.length && data.length > 0 ? (
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="flex-start"
                    gap={1}
                    border="1px solid #ccc"
                    borderRadius={1}
                    p={1}
                >
                    <Typography fontWeight={700}>Changelogs</Typography>

                    {isLoading ? (
                        <LinearProgress />
                    ) : (
                        data?.map((changelog) => (
                            <Link to={changelog.id.toString()}>
                                <Typography key={nanoid()}>
                                    {changelog.name}
                                </Typography>
                            </Link>
                        ))
                    )}
                </Box>
            ) : null}
        </Box>
    );
};

export { Menu };
