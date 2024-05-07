import { LoadingButton } from "@mui/lab";
import { Box, Button, Modal, Typography } from "@mui/material";
import { policiesApi } from "_redux";
import { FC } from "react";
import { toast } from "react-toastify";
import { toastError } from "utils";
import {
    ActionTypeT,
    NestedModalTypeT,
    SelectedEmployeeT,
    defaultModalStyles,
} from "./utils";

interface INestedModalProps {
    open: boolean;
    onClose: () => void;
    policy_id: number;
    modalType: NestedModalTypeT;
    actionType: ActionTypeT;
    selectedEmployee: SelectedEmployeeT;
}

const NestedModal: FC<INestedModalProps> = ({
    open,
    onClose,
    policy_id,
    modalType,
    actionType,
    selectedEmployee,
}) => {
    const [createPolicyExclusion, createPolicyExclusionProps] =
        policiesApi.useCreatePolicyExclusionMutation();
    const [deletePolicyExclusion, deletePolicyExclusionProps] =
        policiesApi.useDeletePolicyExclusionMutation();
    const [notifyUnapprovedEmployees, notifyUnapprovedEmployeesProps] =
        policiesApi.useNotifyUnapprovedEmployeesMutation();

    const handleSubmitExclusionInNestedModal = () => {
        if (actionType && selectedEmployee) {
            let mutation = null;
            let message: string | null = null;

            if (actionType === "exclude") {
                mutation = createPolicyExclusion;
                message = `Person ${selectedEmployee?.english_name} excluded from policy`;
            }

            if (actionType === "restore") {
                mutation = deletePolicyExclusion;
                message = `Person ${selectedEmployee?.english_name} restored to policy`;
            }

            if (mutation && message) {
                mutation({
                    policy_id,
                    employee_id: selectedEmployee.id,
                })
                    .unwrap()
                    .then(() => {
                        onClose();
                        toast.success(message);
                    })
                    .catch((error) => toastError(error));
            }
        }
    };

    const handleSubmitNotification = () => {
        notifyUnapprovedEmployees({ policy_id })
            .unwrap()
            .then(() => {
                onClose();
                toast.success(
                    "The task for sending notifications has been successfully created",
                );
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    ...defaultModalStyles,
                }}
            >
                {modalType === "exclusion" && (
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography fontWeight={500} align="center">
                            {actionType === "exclude"
                                ? `Are you sure you want to exclude a person ${selectedEmployee?.english_name} from policy?`
                                : `Are you sure you want to restore a person ${selectedEmployee?.english_name} to poliсy`}
                        </Typography>

                        <Box display="flex" justifyContent="center" gap={1}>
                            <LoadingButton
                                onClick={handleSubmitExclusionInNestedModal}
                                variant="outlined"
                                size="small"
                                loading={
                                    createPolicyExclusionProps.isLoading ||
                                    deletePolicyExclusionProps.isLoading
                                }
                            >
                                Submit
                            </LoadingButton>
                            <Button
                                onClick={onClose}
                                variant="outlined"
                                size="small"
                                color="error"
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                )}

                {modalType === "notification" && (
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography fontWeight={500} align="center">
                            Are you sure you want to notify all people who have
                            not approved this policy?
                        </Typography>

                        <Box display="flex" justifyContent="center" gap={1}>
                            <LoadingButton
                                onClick={handleSubmitNotification}
                                variant="outlined"
                                size="small"
                                loading={
                                    notifyUnapprovedEmployeesProps.isLoading
                                }
                            >
                                Submit
                            </LoadingButton>
                            <Button
                                onClick={onClose}
                                variant="outlined"
                                size="small"
                                color="error"
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>
        </Modal>
    );
};

export default NestedModal;
