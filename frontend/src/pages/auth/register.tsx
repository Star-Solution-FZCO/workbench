import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { LoadingButton } from "@mui/lab";
import {
    Avatar,
    Box,
    Container,
    CssBaseline,
    TextField,
    ThemeProvider,
    Typography,
} from "@mui/material";
import { Title } from "_components";
import { authActions } from "_redux";
import { AUTH_MODE } from "config";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { theme } from "theme";

type LoginPageStateT = {
    register_token: string;
    password: string;
    inProgress: boolean;
};

export const RegisterPage: React.FC = () => {
    if (AUTH_MODE !== "local") {
        return <Typography>Registration is disabled.</Typography>;
    }

    const navigate = useNavigate();

    const [state, setState] = useState<LoginPageStateT>({
        register_token: "",
        password: "",
        inProgress: false,
    });

    const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setState({ ...state, inProgress: true });

        const handleSuccessSubmit = () => {
            setState({ ...state, inProgress: false });
            navigate("/login");
        };

        const handleErrorSubmit = (response: any) => {
            setState({ ...state, inProgress: false });
            toast.error(response.detail || response.message);
        };

        authActions.register(handleSuccessSubmit, handleErrorSubmit)(
            state.register_token,
            state.password,
        );
    };

    const handleChange = ({
        target: { name, value },
    }: React.ChangeEvent<HTMLInputElement>) => {
        setState({ ...state, ...{ [name]: value } });
    };

    return (
        <ThemeProvider theme={theme}>
            <Title title="Registration" />

            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <Box
                    sx={{
                        marginTop: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                        <LockOutlinedIcon />
                    </Avatar>

                    <Typography component="h1" variant="h5">
                        Registration
                    </Typography>

                    <Box component="form" noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="register_token"
                            label="Registration token"
                            name="register_token"
                            autoFocus
                            variant="standard"
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            variant="standard"
                            onChange={handleChange}
                            value={state.password}
                        />

                        <LoadingButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            onClick={handleSubmit}
                            loading={state.inProgress}
                        >
                            Submit
                        </LoadingButton>

                        <Typography variant="body2">
                            <a href={"/login"}>Login</a>
                        </Typography>
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
};
