import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { LoadingButton } from "@mui/lab";
import {
    Avatar,
    Box,
    Container,
    CssBaseline,
    FormControl,
    Grid,
    ThemeProvider,
    Typography,
} from "@mui/material";
import { FormTextField, Title } from "_components";
import { authActions } from "_redux";
import { AUTH_MODE, passwordValidationRules } from "config";
import PasswordGenerator from "pages/password_generator";
import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { theme } from "theme";
import { genRules, toastError } from "utils";

type RegisterPageFormT = {
    register_token: string;
    password: string;
    password2: string;
};

export const RegisterPage: React.FC = () => {
    if (AUTH_MODE !== "local") {
        return <Typography>Registration is disabled.</Typography>;
    }

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const methods = useForm<RegisterPageFormT>({
        defaultValues: {
            register_token: searchParams.get("register_token") || "",
            password: "",
            password2: "",
        },
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = (formData: RegisterPageFormT) => {
        setIsLoading(true);
        if (formData.password !== formData.password2) {
            toast.error("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        const handleSuccessSubmit = () => {
            navigate("/login");
        };

        const handleErrorSubmit = (response: any) => {
            setIsLoading(false);
            toastError({ data: response });
        };

        authActions.register(handleSuccessSubmit, handleErrorSubmit)(
            formData.register_token,
            formData.password,
        );
    };

    return (
        <>
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

                        <Box sx={{ mt: 1 }}>
                            <FormProvider {...methods}>
                                <form
                                    onSubmit={methods.handleSubmit(
                                        handleSubmit,
                                        () => {},
                                    )}
                                >
                                    <Grid container spacing={1}>
                                        <Grid item xs={12}>
                                            <FormControl
                                                sx={{ m: 1 }}
                                                fullWidth
                                            >
                                                <FormTextField
                                                    name="register_token"
                                                    label="Registration token"
                                                    register={methods.register}
                                                    rules={genRules({
                                                        required: true,
                                                    })}
                                                    // @ts-ignore
                                                    errors={
                                                        methods.formState.errors
                                                    }
                                                />
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <FormControl
                                                sx={{ m: 1 }}
                                                fullWidth
                                            >
                                                <FormTextField
                                                    name="password"
                                                    label="New password"
                                                    register={methods.register}
                                                    type="password"
                                                    rules={genRules({
                                                        required: true,
                                                        minLength: 11,
                                                    })}
                                                    // @ts-ignore
                                                    errors={
                                                        methods.formState.errors
                                                    }
                                                />
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <FormControl
                                                sx={{ m: 1 }}
                                                fullWidth
                                            >
                                                <FormTextField
                                                    name="password2"
                                                    label="Repeat password"
                                                    register={methods.register}
                                                    type="password"
                                                    rules={genRules({
                                                        required: true,
                                                        minLength: 11,
                                                    })}
                                                    // @ts-ignore
                                                    errors={
                                                        methods.formState.errors
                                                    }
                                                />
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <LoadingButton
                                                fullWidth
                                                variant="contained"
                                                sx={{ mt: 3, mb: 2, m: 1 }}
                                                loading={isLoading}
                                                type="submit"
                                            >
                                                Submit
                                            </LoadingButton>
                                        </Grid>
                                    </Grid>
                                </form>
                            </FormProvider>

                            <Box
                                display={"flex"}
                                justifyContent={"space-between"}
                            >
                                <Typography variant="body2">
                                    <a href={"/login"}>Login</a>
                                </Typography>
                            </Box>
                            <ul>
                                <Typography variant={"body2"} sx={{ m: 1 }}>
                                    Password requirements:
                                    {passwordValidationRules.map((rule) => (
                                        <li key={rule}>{rule}</li>
                                    ))}
                                </Typography>
                            </ul>
                        </Box>
                    </Box>
                </Container>
            </ThemeProvider>
            <PasswordGenerator />
        </>
    );
};
