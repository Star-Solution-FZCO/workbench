import ReplayIcon from "@mui/icons-material/Replay";
import { Box, Button, Typography } from "@mui/material";
import * as Sentry from "@sentry/react";
import React, { FC } from "react";

const DYNAMIC_IMPORT_ERROR_MESSAGE =
    "error loading dynamically imported module";

const FallbackContainer: FC<React.PropsWithChildren> = ({ children }) => {
    return (
        <Box
            width="100vw"
            height="100vh"
            display="flex"
            justifyContent="center"
            alignItems="center"
        >
            {children}
        </Box>
    );
};

const DefaultFallback = () => {
    return (
        <FallbackContainer>
            <Typography variant="h4" align="center">
                Try to reload the page. If the problem persists, contact support
            </Typography>
        </FallbackContainer>
    );
};

const NewReleaseVersionFallback = () => {
    return (
        <FallbackContainer>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={1}
            >
                <Typography variant="h4" align="center">
                    Workbench new version has been released 🚀
                    <br />
                    Reload the page to update the site 🌐
                </Typography>

                <Button
                    onClick={() => {
                        window.location.reload();
                    }}
                    endIcon={
                        <ReplayIcon
                            sx={{ transform: "scale(-1, 1) rotate(-90deg)" }}
                        />
                    }
                    variant="outlined"
                    size="large"
                >
                    Reload page
                </Button>
            </Box>
        </FallbackContainer>
    );
};

const ErrorBoundary: FC<React.PropsWithChildren> = ({ children }) => {
    return (
        <Sentry.ErrorBoundary
            fallback={({ error }) =>
                error.message.includes(DYNAMIC_IMPORT_ERROR_MESSAGE) ? (
                    <NewReleaseVersionFallback />
                ) : (
                    <DefaultFallback />
                )
            }
        >
            {children}
        </Sentry.ErrorBoundary>
    );
};

export default ErrorBoundary;
