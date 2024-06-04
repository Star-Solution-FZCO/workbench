import { LoadingButton } from "@mui/lab";
import { FormControl, Grid, Typography } from "@mui/material";
import { FormTextField, Modal } from "_components";
import { sharedApi } from "_redux";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { PasswordSetT } from "types";
import { genRules } from "utils";

interface IPasswordSetDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const passwordSetInitialState: PasswordSetT = {
    otp_code: "",
    password: "",
};

export const PasswordSetDialog: FC<IPasswordSetDialogProps> = ({
    open,
    onClose,
    onSuccess,
}) => {
    const methods = useForm<PasswordSetT>({
        defaultValues: passwordSetInitialState,
    });
    const [setPassword, { isLoading }] = sharedApi.useSetPasswordMutation();

    const handleOnSubmit = (formData: PasswordSetT) => {
        if (formData.otp_code === "" || formData.password === "") {
            toast.error("All fields are required.");
            return;
        }

        setPassword(formData)
            .unwrap()
            .then(() => {
                toast.success("Password has been changed.");
                onSuccess();
                onClose();
            })
            .catch((error) => {
                toast.error(
                    error.detail || error.message || error.data?.detail,
                );
            });
    };

    return (
        <Modal open={open} onClose={onClose}>
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
