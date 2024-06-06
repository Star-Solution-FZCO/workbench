import { LoadingButton } from "@mui/lab";
import { FormControl, Grid, Typography } from "@mui/material";
import { FormTextField, Modal } from "_components";
import { sharedApi } from "_redux";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { PasswordSetT } from "types";
import { genRules, toastError } from "utils";

interface IPasswordSetDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type PasswordSetFormT = PasswordSetT & { password2: string };

export const PasswordSetDialog: FC<IPasswordSetDialogProps> = ({
    open,
    onClose,
    onSuccess,
}) => {
    const methods = useForm<PasswordSetFormT>({
        defaultValues: {
            otp_code: "",
            password: "",
            password2: "",
        },
    });
    const [setPassword, { isLoading }] = sharedApi.useSetPasswordMutation();

    const handleClose = () => {
        methods.reset();
        onClose();
    };

    const handleOnSubmit = (formData: PasswordSetFormT) => {
        if (formData.password !== formData.password2) {
            toast.error("Passwords do not match.");
            return;
        }
        setPassword({
            otp_code: formData.otp_code,
            password: formData.password,
        })
            .unwrap()
            .then(() => {
                toast.success("Password has been changed.");
                onSuccess();
                handleClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Typography component="h1" variant="h5">
                Set new password
            </Typography>

            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(handleOnSubmit, () => {})}>
                    <Grid container spacing={1}>
                        <Grid item xs={12}>
                            <FormControl sx={{ m: 1, width: "16rem" }}>
                                <FormTextField
                                    name="otp_code"
                                    label="OTP code"
                                    register={methods.register}
                                    rules={genRules({
                                        required: true,
                                        maxLength: 6,
                                        minLength: 6,
                                    })}
                                    // @ts-ignore
                                    errors={methods.formState.errors}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl sx={{ m: 1, width: "16rem" }}>
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
                                    errors={methods.formState.errors}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl sx={{ m: 1, width: "16rem" }}>
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
                                    errors={methods.formState.errors}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <LoadingButton
                                disabled={false}
                                loading={isLoading}
                                type="submit"
                            >
                                Submit
                            </LoadingButton>
                        </Grid>
                    </Grid>
                </form>
            </FormProvider>
        </Modal>
    );
};
