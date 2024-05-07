import { LoadingButton } from "@mui/lab";
import { Box, Button, Typography } from "@mui/material";
import { StaticDatePicker } from "@mui/x-date-pickers";
import { Modal } from "_components";
import { scheduleApi } from "_redux";
import { format } from "date-fns";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import { EmployeeScheduleExclusionT } from "types";
import { toastError } from "utils";
import { formatDateYYYYMMDD } from "utils/convert";
import { ActionT } from "./utils";

interface IActionFormProps {
    employee_id: number;
    exclusion: EmployeeScheduleExclusionT | null;
    action: ActionT | null;
    open: boolean;
    onClose: () => void;
}

const ActionForm: FC<IActionFormProps> = ({
    employee_id,
    exclusion,
    action,
    open,
    onClose,
}) => {
    const [cancelExclusion, cancelExclusionProps] =
        scheduleApi.useCancelEmployeeScheduleExclusionMutation();

    const [cancelOneDayInExclusion, cancelOneDayInExclusionProps] =
        scheduleApi.useCancelOneDayInScheduleExclusionMutation();

    const [date, setDate] = useState<Date | null>(null);

    const submit = (action: ActionT | null) => {
        let mutation = null;
        let successMessage = "";
        let params = null;

        if (!exclusion || !action) return;

        if (action === "cancellation") {
            mutation = cancelExclusion;
            params = { id: employee_id, guid: exclusion.guid };
            successMessage = "Exclusion has been successfully cancelled";
        }

        if (action === "exclusion") {
            mutation = cancelOneDayInExclusion;
            params = {
                id: employee_id,
                day: date ? formatDateYYYYMMDD(date) : null,
            };
            successMessage = "Day has been successfully excluded";
        }

        if (!mutation || !params) return;

        // @ts-ignore
        mutation(params)
            .unwrap()
            .then(() => {
                if (action === "exclusion") {
                    setDate(null);
                }
                toast.success(successMessage);
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const exclusion_type = exclusion?.type?.split("_")?.join(" ");

    if (!exclusion) {
        return (
            <Modal open={open} onClose={onClose}>
                <Box display="flex" flexDirection="column" gap={1}>
                    <Typography fontWeight={500}>
                        No selected exclusion
                    </Typography>

                    <Button
                        sx={{ alignSelf: "flex-start" }}
                        onClick={onClose}
                        variant="outlined"
                        color="error"
                    >
                        Close
                    </Button>
                </Box>
            </Modal>
        );
    }

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={2}
            >
                <Typography fontWeight={500} maxWidth="400px" align="center">
                    {action === "cancellation"
                        ? `Do you confirm your cancellation to ${exclusion_type} in
                        the period from`
                        : `Choose a day to be excluded from ${exclusion_type} in
                        the period from`}{" "}
                    {format(new Date(exclusion.start), "dd MMM yyyy")} to{" "}
                    {format(new Date(exclusion.end), "dd MMM yyyy")}
                    {action === "cancellation" && "?"}
                </Typography>

                {action === "exclusion" && (
                    <StaticDatePicker
                        value={date}
                        onChange={(value) => setDate(value)}
                        minDate={new Date(exclusion.start)}
                        maxDate={new Date(exclusion.end)}
                        slotProps={{ actionBar: { actions: [] } }}
                        orientation="landscape"
                    />
                )}

                <Box display="flex" gap={1}>
                    <LoadingButton
                        onClick={() => submit(action)}
                        variant="outlined"
                        loading={
                            cancelExclusionProps.isLoading ||
                            cancelOneDayInExclusionProps.isLoading
                        }
                        disabled={
                            cancelExclusionProps.isLoading ||
                            cancelOneDayInExclusionProps.isLoading ||
                            (action === "exclusion" && date === null)
                        }
                    >
                        Submit
                    </LoadingButton>
                    <Button onClick={onClose} variant="outlined" color="error">
                        Close
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default ActionForm;
