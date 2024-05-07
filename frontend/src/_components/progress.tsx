import { Box, CircularProgress } from "@mui/material";

type CircularLoadingPropsT = {};
export const CircularLoading: React.FC<CircularLoadingPropsT> = () => {
    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100%"
            height="100%"
        >
            <CircularProgress />
        </Box>
    );
};
