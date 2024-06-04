import { Box, Button, Typography } from "@mui/material";
import { authActions } from "_redux";
import { AUTH_MODE, loginPageUrl } from "config";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PasswordSetDialog } from "./components/set_form.tsx";

const PasswordView = () => {
    if (AUTH_MODE !== "local") {
        return <Typography>Not supported</Typography>;
    }

    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState<boolean>(false);

    const handleSuccess = () => {
        authActions.logout();
        navigate(loginPageUrl);
    };

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            {modalOpen && (
                <PasswordSetDialog
                    open={true}
                    onClose={() => setModalOpen(false)}
                    onSuccess={handleSuccess}
                />
            )}
            <Box display="flex" alignItems="center" gap={1}>
                <Button
                    onClick={() => {
                        setModalOpen(true);
                    }}
                    variant="outlined"
                    size="small"
                    disabled={modalOpen}
                >
                    Set new password
                </Button>
            </Box>
        </Box>
    );
};

export default PasswordView;
