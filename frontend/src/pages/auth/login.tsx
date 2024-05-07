import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { LoadingButton } from "@mui/lab";
import {
    Avatar,
    Box,
    Checkbox,
    Container,
    CssBaseline,
    FormControlLabel,
    TextField,
    ThemeProvider,
    Typography,
} from "@mui/material";
import { Title } from "_components";
import { authActions, profileLoaded, useAppDispatch } from "_redux";
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { theme } from "theme";
import { ProfileModelT } from "types/models";

type LoginPageStateT = {
    username: string;
    password: string;
    remember: boolean;
    inProgress: boolean;
};

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();

    const [state, setState] = useState<LoginPageStateT>({
        username: "",
        password: "",
        remember: false,
        inProgress: false,
    });

    const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setState({ ...state, inProgress: true });

        const handleSuccessLogin = (data: ProfileModelT) => {
            dispatch(profileLoaded(data));

            setState({ ...state, inProgress: false });

            if (searchParams.get("redirectTo"))
                navigate(`${searchParams.get("redirectTo")}`);
            else navigate("/");
        };

        const handleErrorLogin = (response: any) => {
            setState({ ...state, inProgress: false });
            toast.error(response.detail || response.message);
        };

        authActions.login(handleSuccessLogin, handleErrorLogin)(
            state.username,
            state.password,
            state.remember,
        );
    };

    const handleChange = ({
        target: { name, value },
    }: React.ChangeEvent<HTMLInputElement>) => {
        setState({ ...state, ...{ [name]: value } });
    };

    const handleCheckBoxChange = ({
        target: { value, checked },
    }: React.ChangeEvent<HTMLInputElement>) => {
        setState({ ...state, ...{ [value]: checked } });
    };

    return (
        <ThemeProvider theme={theme}>
            <Title title="Login" />

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
                        Sign in
                    </Typography>

                    <Box component="form" noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            variant="standard"
                            onChange={handleChange}
                            value={state.username}
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
                        <FormControlLabel
                            control={
                                <Checkbox
                                    value="remember"
                                    color="primary"
                                    checked={state.remember}
                                    onChange={handleCheckBoxChange}
                                />
                            }
                            label="Remember me"
                        />

                        <LoadingButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            onClick={handleSubmit}
                            loading={state.inProgress}
                        >
                            Sign In
                        </LoadingButton>

                        <Typography variant="body2">
                            Use your domain credentials for login.
                        </Typography>
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
};
