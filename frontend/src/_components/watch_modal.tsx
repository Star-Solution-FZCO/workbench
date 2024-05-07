import { Box, Button, Typography } from "@mui/material";
import { Modal } from "_components";
import { employeesApi } from "_redux";
import { FC, useCallback } from "react";
import { toast } from "react-toastify";
import { EmployeeT } from "types";
import { toastError } from "utils";

interface IWatchModalProps {
    open: boolean;
    onClose: () => void;
    employee: EmployeeT | null;
}

const WatchModal: FC<IWatchModalProps> = ({ open, onClose, employee }) => {
    const [watchEmployee] = employeesApi.useWatchEmployeeMutation();
    const [unwatchEmployee] = employeesApi.useUnwatchEmployeeMutation();

    const processWatchEmployee = useCallback(
        (employee: EmployeeT) => {
            if (!employee.is_current_user_watch) {
                watchEmployee(employee.id)
                    .unwrap()
                    .then(() => {
                        onClose();
                        toast.success(
                            `Now you will receive a report on the activity of the person ${employee.english_name}`,
                        );
                    })
                    .catch((error) => {
                        toastError(error);
                    });
            } else {
                unwatchEmployee(employee.id)
                    .unwrap()
                    .then(() => {
                        onClose();
                        toast.info(
                            `You have unsubscribed from notifications about the activity of person ${employee.english_name}`,
                        );
                    })
                    .catch((error) => {
                        toastError(error);
                    });
            }
        },
        [watchEmployee, unwatchEmployee, onClose],
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
                    {employee?.is_current_user_watch ? "Unwatch" : "Watch"}
                    &nbsp;person {employee?.english_name}?
                </Typography>

                <Box display="flex" gap={1}>
                    <Button
                        onClick={() => {
                            employee && processWatchEmployee(employee);
                        }}
                        variant="outlined"
                    >
                        {employee?.is_current_user_watch ? "Unwatch" : "Watch"}
                    </Button>
                    <Button onClick={onClose} variant="outlined" color="error">
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default WatchModal;
