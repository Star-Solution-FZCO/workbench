import { LoadingButton } from "@mui/lab";
import {
    Box,
    Checkbox,
    FormControlLabel,
    LinearProgress,
    Link,
    TextField,
    Typography,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers-pro";
import { requestsApi, useAppSelector } from "_redux";
import { OFFBOARD_CHECKLIST_URL, YOUTRACK_URL } from "config";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { toastError } from "utils";
import { toISOUTC } from "utils/convert";
import { ShortEmployeeBy } from "../components";

const DismissEmployeeRequestView = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "GMT";

    const [datetime, setDatetime] = useState<Date | null>(null);
    const [description, setDescription] = useState<string | null>("");
    const [checklistChecked, setChecklistChecked] = useState(false);

    const { data: request, isLoading: requestLoading } =
        requestsApi.useGetDismissEmployeeRequestQuery(Number(id), {
            skip: !id,
        });

    const [updateRequest, { isLoading: updateLoading }] =
        requestsApi.useUpdateDismissEmployeeRequestMutation();
    const [approveRequest, { isLoading: approveLoading }] =
        requestsApi.useApproveDismissEmployeeRequestMutation();
    const [cancelRequest, { isLoading: cancelLoading }] =
        requestsApi.useCancelDismissEmployeeRequestMutation();

    const handleClickSave = () => {
        if (!request) return;
        if (!datetime) return;

        updateRequest({
            id: request.id,
            dismiss_datetime: toISOUTC(datetime, timezone),
            description,
        })
            .unwrap()
            .then(() => {
                toast.success("Request successfully updated");
            })
            .catch((error) => toastError(error));
    };

    const handleApprove = () => {
        if (!request) return;

        const confirmed = confirm(
            "Are you sure you want to approve the request?",
        );
        if (!confirmed) return;

        if (!checklistChecked) {
            toast.error("Checklist not checked");
            return;
        }

        approveRequest({ id: request.id, checklist_checked: checklistChecked })
            .unwrap()
            .then(() => {
                toast.success("Request successfully approved");
                navigate("/requests?type=dismiss-employee");
            })
            .catch((error) => toastError(error));
    };

    const handleCancel = () => {
        if (!request) return;

        const confirmed = confirm(
            "Are you sure you want to cancel the request?",
        );
        if (!confirmed) return;

        cancelRequest(request.id)
            .unwrap()
            .then(() => {
                toast.success("Request successfully cancelled");
                navigate("/requests?type=dismiss-employee");
            })
            .catch((error) => toastError(error));
    };

    useEffect(() => {
        if (request) {
            setChecklistChecked(request.checklist_checked);
            setDatetime(
                toZonedTime(request.dismiss_datetime + "+00:00", timezone),
            );
            setDescription(request.description);
        }
    }, [request]);

    if (requestLoading) return <LinearProgress />;

    if (!request) {
        return <Navigate to="/requests" />;
    }

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="flex-start"
            gap={1}
        >
            <Typography variant="h6">Dismiss employee request</Typography>

            <ShortEmployeeBy
                label="Created by:"
                employee={request.created_by}
            />
            <ShortEmployeeBy
                label="Person who needs to be dismissed:"
                employee={request.employee}
            />
            {request.approved_by && (
                <ShortEmployeeBy
                    label="Request approved by:"
                    employee={request.approved_by}
                />
            )}
            {request.approved_by && (
                <ShortEmployeeBy
                    label="Request approved by:"
                    employee={request.approved_by}
                />
            )}

            <Typography>
                <Typography component="span" fontWeight={500}>
                    Updated:
                </Typography>
                &nbsp;
                {formatInTimeZone(
                    request.updated + "+00:00",
                    timezone,
                    "dd MMMM yyyy - HH:mm:ss (O)",
                )}
            </Typography>

            <Link
                href={YOUTRACK_URL + "/issue/" + request.youtrack_issue_id}
                target="_blank"
                rel="noreferrer noopener"
            >
                Youtrack ticket - {request.youtrack_issue_id}
            </Link>

            <Typography>
                <Typography component="span" fontWeight={500}>
                    Dismiss datetime:
                </Typography>
                &nbsp;
                {formatInTimeZone(
                    request.dismiss_datetime + "+00:00",
                    timezone,
                    "dd MMMM yyyy - HH:mm:ss (O)",
                )}
            </Typography>

            <Typography>
                <Typography component="span" fontWeight={500}>
                    Timezone:
                </Typography>
                &nbsp;
                {timezone}
            </Typography>

            <DateTimePicker
                label="Dismiss datetime"
                value={datetime}
                onChange={(value) => setDatetime(value)}
                disabled={request.can_approve}
            />

            <TextField
                sx={{ maxWidth: "500px" }}
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={8}
                disabled={request.can_cancel}
                fullWidth
            />

            <FormControlLabel
                control={
                    <Checkbox
                        sx={{ py: 0 }}
                        checked={checklistChecked}
                        onChange={(_, checked) => setChecklistChecked(checked)}
                        disabled={["CLOSED", "APPROVED"].includes(
                            request.status,
                        )}
                    />
                }
                label="Checklist сhecked?"
            />

            <Link
                href={OFFBOARD_CHECKLIST_URL}
                target="_blank"
                rel="noreferrer noopener"
            >
                Offboard checklist
            </Link>

            <Box display="flex" gap={1}>
                {request.can_update && (
                    <LoadingButton
                        onClick={handleClickSave}
                        variant="outlined"
                        size="small"
                        loading={updateLoading}
                        disabled={!datetime}
                    >
                        Save
                    </LoadingButton>
                )}
                {request.can_approve && (
                    <LoadingButton
                        onClick={handleApprove}
                        variant="outlined"
                        size="small"
                        color="success"
                        disabled={!checklistChecked}
                        loading={approveLoading}
                    >
                        Approve
                    </LoadingButton>
                )}

                {request.can_cancel && (
                    <LoadingButton
                        onClick={handleCancel}
                        variant="outlined"
                        size="small"
                        color="error"
                        loading={cancelLoading}
                    >
                        Cancel
                    </LoadingButton>
                )}
            </Box>
        </Box>
    );
};

export { DismissEmployeeRequestView };
