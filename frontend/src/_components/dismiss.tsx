import { Close } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    CircularProgress,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers-pro";
import { employeesApi, requestsApi, useAppSelector } from "_redux";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DismissAdminEmployeeT } from "types/models";
import { toastError } from "utils";
import { toISOUTC } from "utils/convert";

type DismissEmployeePropsT = DismissAdminEmployeeT & {
    onClose: () => void;
};

export const DismissSubmitDialog: React.FC<DismissEmployeePropsT> = ({
    id,
    onClose,
}) => {
    const navigate = useNavigate();
    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "UTC";

    const { data } = employeesApi.useGetEmployeeQuery({ id });

    const [datetime, setDatetime] = useState<Date | null>(null);
    const [description, setDescription] = useState("");

    const [createDismissEmployeeRequest, { isLoading }] =
        requestsApi.useCreateDismissEmployeeRequestMutation();

    const handleClickDismiss = () => {
        if (!datetime) return;

        createDismissEmployeeRequest({
            employee_id: id,
            dismiss_datetime: toISOUTC(datetime, timezone),
            description,
        })
            .unwrap()
            .then((res) => {
                onClose();
                toast.success("Dismiss employee request successfully created");
                navigate(`/requests/dismiss-employee/${res.payload.id}`);
            })
            .catch((error) => toastError(error));
    };

    if (!data)
        return (
            <Box display="flex" alignItems="center" justifyContent="center">
                <CircularProgress />
            </Box>
        );

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                width="100%"
            >
                <Typography fontWeight={500}>
                    Dismiss {data.payload.english_name}?
                </Typography>

                <IconButton onClick={onClose}>
                    <Close />
                </IconButton>
            </Box>

            <Typography>
                Timezone:{" "}
                <Typography component="span" fontWeight={500}>
                    {timezone}
                </Typography>
            </Typography>

            <DateTimePicker
                label="Actual date and time of the person's dismissal"
                value={datetime}
                onChange={(value) => setDatetime(value)}
                slotProps={{
                    textField: {
                        required: true,
                    },
                }}
            />

            <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={5}
            />

            <LoadingButton
                onClick={handleClickDismiss}
                type="submit"
                variant="outlined"
                color="error"
                size="small"
                loading={isLoading}
                disabled={!datetime}
            >
                Dismiss
            </LoadingButton>
        </Box>
    );
};
