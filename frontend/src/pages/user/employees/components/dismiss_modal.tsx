import { Box, Button, Typography } from "@mui/material";
import { Modal } from "_components";
import { employeesApi } from "_redux";
import { FC, useCallback } from "react";
import { toast } from "react-toastify";
import { EmployeeT } from "types";
import { toastError } from "utils";

interface IDismissModalProps {
    open: boolean;
    onClose: () => void;
    employee: EmployeeT | null;
}

const DismissModal: FC<IDismissModalProps> = ({ open, onClose, employee }) => {
    const [dismissEmployee] = employeesApi.useDismissEmployeeMutation();

    const dismiss = useCallback(
        (employee: EmployeeT) => {
            dismissEmployee(employee.id)
                .unwrap()
                .then(() => {
                    onClose();
                    toast.success(
                        `Person ${employee.english_name} was successfully dismissed`,
                    );
                })
                .catch((error) => {
                    toastError(error);
                });
        },
        [dismissEmployee, onClose],
    );

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={2}
            >
                <Typography fontWeight={500}>
                    Are you sure you want to dismiss {employee?.english_name}?
                </Typography>

                <Box display="flex" gap={1}>
                    <Button
                        onClick={() => {
                            employee && dismiss(employee);
                        }}
                        variant="outlined"
                    >
                        Dismiss
                    </Button>
                    <Button onClick={onClose} variant="outlined" color="error">
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default DismissModal;
