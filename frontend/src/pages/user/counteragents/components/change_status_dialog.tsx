import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    Typography,
} from "@mui/material";
import { Modal } from "_components";
import { employeesApi } from "_redux";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import { CounteragentT } from "types";

const actionVerbMap = {
    invalidate: "invalidated",
    suspend: "suspended",
    restore: "restored",
};

interface IChangeCounterAgentStatusDialogProps {
    open: boolean;
    onClose: () => void;
    counteragent: CounteragentT;
    action: "invalidate" | "suspend" | "restore";
}

const ChangeCounterAgentStatusDialog: FC<
    IChangeCounterAgentStatusDialogProps
> = ({ open, onClose, counteragent, action }) => {
    const [applySubagents, setApplySubagents] = useState(false);

    const [bulkInvalidateCounteragent, { isLoading: invalidationLoading }] =
        employeesApi.useBulkInvalidateCounteragentMutation();

    const [bulkSuspendCounteragent, { isLoading: suspendingLoading }] =
        employeesApi.useBulkSuspendCounteragentMutation();

    const [bulkRestoreCounteragent, { isLoading: restoringLoading }] =
        employeesApi.useBulkRestoreCounteragentMutation();

    const mutationMap = {
        invalidate: bulkInvalidateCounteragent,
        suspend: bulkSuspendCounteragent,
        restore: bulkRestoreCounteragent,
    };

    const handleSubmit = () => {
        const mutation = mutationMap[action];

        mutation({
            agents: [counteragent.id],
            apply_subagents: applySubagents,
        }).then(() => {
            onClose();
            toast.success("Counteragent successfully " + actionVerbMap[action]);
        });
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={1}
            >
                <Typography fontWeight={500}>
                    Are you sure you want to{" "}
                    {action === "invalidate" ? "invalidate" : "suspend"}{" "}
                    {counteragent.english_name}?
                </Typography>

                {counteragent.group && (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={applySubagents}
                                onChange={(e) =>
                                    setApplySubagents(e.target.checked)
                                }
                            />
                        }
                        label="Apply to subagents"
                    />
                )}

                <Box display="flex" gap={1}>
                    <LoadingButton
                        onClick={handleSubmit}
                        variant="outlined"
                        size="small"
                        loading={
                            invalidationLoading ||
                            suspendingLoading ||
                            restoringLoading
                        }
                    >
                        Submit
                    </LoadingButton>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        size="small"
                        color="error"
                        disabled={
                            invalidationLoading ||
                            suspendingLoading ||
                            restoringLoading
                        }
                    >
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export { ChangeCounterAgentStatusDialog };
