import { Box, Button, FormControl, Typography } from "@mui/material";
import { FormTextField, Modal } from "_components";
import { requestsApi } from "_redux";
import React, { FC, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { genRules, toastError } from "utils";

type RequestDialogPropsT = React.PropsWithChildren & {
    open: boolean;
    onClose: (value: false) => void;
};

const RequestDialog: FC<RequestDialogPropsT> = ({
    children,
    open,
    onClose,
}) => {
    const handleClose = useCallback(() => onClose(false), [onClose]);

    if (!open) return null;

    return (
        <Modal open={open} onClose={handleClose}>
            {children}
        </Modal>
    );
};

type ReasonDialogFormPropsT = {
    ids: number[];
    onClose: () => void;
};

type RequestFormDataT = { reason: string };

export const ReasonDialogForm: React.FC<ReasonDialogFormPropsT> = ({
    ids,
    onClose,
}) => {
    const [bulkCloseRequests, { isLoading }] =
        requestsApi.useBulkCloseJoinTeamRequestMutation();

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isValid, isSubmitting },
        reset,
    } = useForm<RequestFormDataT>({
        defaultValues: { reason: "" },
        mode: "onChange",
    });

    const handleClose = () => {
        if (isLoading || isSubmitting) {
            return toast.info(
                "Request in progress, please wait until complete",
            );
        }
        reset();
        onClose();
    };

    const handleCloseOutSideClick = () => {
        if (isDirty) {
            return toast.info("Reason is not empty, use close button");
        }
        handleClose();
    };

    const handleOnSubmit = ({ reason }: RequestFormDataT) => {
        bulkCloseRequests({ ids, reason })
            .unwrap()
            .then(() => {
                const message = "Request" + (ids.length > 1 ? "s" : "");
                handleClose();
                toast.success(message + " successfully canceled");
            })
            .catch((error) => toastError(error));
    };

    return (
        <RequestDialog open={!!ids.length} onClose={handleCloseOutSideClick}>
            <form onSubmit={handleSubmit(handleOnSubmit)}>
                <Box display="flex" flexDirection="column">
                    <Typography>
                        Please enter reason why you are closing request
                    </Typography>
                    <FormControl sx={{ mt: 1 }}>
                        <FormTextField
                            label="Reason"
                            register={register}
                            name={"reason"}
                            // @ts-ignore
                            errors={errors}
                            rules={genRules({ required: true, minLength: 6 })}
                        />
                    </FormControl>
                    <Box
                        display="flex"
                        flexDirection="row"
                        justifyContent="end"
                        mt={2}
                    >
                        <Button disabled={isLoading} onClick={handleClose}>
                            Close
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                isLoading ||
                                isSubmitting ||
                                !isDirty ||
                                !isValid
                            }
                        >
                            Submit
                        </Button>
                    </Box>
                </Box>
            </form>
        </RequestDialog>
    );
};
