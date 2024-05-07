import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { requestsApi, useAppSelector } from "_redux";
import { formatInTimeZone } from "date-fns-tz";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { toastError } from "utils";
import { ReasonDialogForm } from "../components/reason_dialog";

const JoinTeamRequestView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "GMT";
    const profile = useAppSelector((state) => state.profile.payload);

    if (id === undefined) navigate("..");

    const {
        data: request,
        error,
        isUninitialized,
    } = requestsApi.useGetJoinTeamRequestQuery({
        id: parseInt(id as string),
    });

    const [approveRequest] = requestsApi.useApproveJoinTeamRequestMutation();

    const [requestDialogOpen, setRequestDialogOpen] = useState<number | null>(
        null,
    );

    const closeRequestDialog = useCallback(() => {
        setRequestDialogOpen(null);
    }, []);

    const cancelRequest = useCallback(
        (id: number) => () => {
            setRequestDialogOpen(id);
        },
        [],
    );

    const approve = useCallback(
        (id: number) => () => {
            if (!request) return;

            const confirmMessage =
                profile.id === request.data.employee.value
                    ? `Are you sure you want to join "${request.data.team.label}" team?`
                    : `Are you sure you want to add ${request.data.employee.label} to "${request.data.team.label}" team?`;

            const confirmed = confirm(confirmMessage);
            if (!confirmed) return;

            approveRequest({ id })
                .unwrap()
                .then(() => {
                    toast.success("Request successfully approved");
                })
                .catch((error) => toastError(error));
        },
        [approveRequest, profile.id, request],
    );

    if (error && "status" in error && error.status === 404) {
        toast.error(`Request with id ${id} not found`);
        navigate("..");
    }

    const renderCloseDialog = useMemo(
        () => (
            <ReasonDialogForm
                ids={requestDialogOpen ? [requestDialogOpen] : []}
                onClose={closeRequestDialog}
            />
        ),
        [closeRequestDialog, requestDialogOpen],
    );

    if (isUninitialized || !request)
        return (
            <Box display="flex" alignItems="center" justifyContent="center">
                <CircularProgress />
            </Box>
        );

    if (request.type !== "JOIN_TEAM") navigate("..");

    return (
        <>
            {renderCloseDialog}
            <Box display="flex" flexDirection="column" gap={1}>
                <Typography>
                    Date:{" "}
                    {formatInTimeZone(
                        request.data.date + "Z",
                        timezone,
                        "dd MMMM yyyy - HH:mm:ss (O)",
                    )}
                </Typography>
                <Typography>Person: {request.data.employee.label}</Typography>
                <Typography>Team: {request.data.team.label}</Typography>
                <Typography>
                    Message (comment): {request.data.message}
                </Typography>

                <Box display="flex" alignItems="center" gap={1}>
                    {request.can_approve && (
                        <Button
                            variant="contained"
                            color={"success"}
                            onClick={approve(parseInt(id as string))}
                        >
                            Approve
                        </Button>
                    )}

                    {request.can_cancel && (
                        <Button
                            variant="contained"
                            color={"error"}
                            onClick={cancelRequest(parseInt(id as string))}
                        >
                            Cancel
                        </Button>
                    )}
                </Box>
            </Box>
        </>
    );
};

export { JoinTeamRequestView };
