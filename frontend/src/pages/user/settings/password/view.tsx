import { Box, Button, Typography } from "@mui/material";
import { authActions } from "_redux";
import { AUTH_MODE, loginPageUrl, passwordValidationRules } from "config";
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
            <PasswordSetDialog
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={handleSuccess}
            />
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
            <Typography variant={"body2"} sx={{ m: 1 }}>
                <ul>
                    Password requirements:
                    {passwordValidationRules.map((rule) => (
                        <li key={rule}>{rule}</li>
                    ))}
                </ul>
            </Typography>
        </Box>
    );
};

export default PasswordView;
