import { LoadingButton } from "@mui/lab";
import { Box, Divider, LinearProgress, Link, Typography } from "@mui/material";
import { requestsApi, useAppSelector } from "_redux";
import { YOUTRACK_URL, onboardingFields } from "config";
import { format } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { omit, pick } from "lodash";
import { EmployeeForm } from "pages/user/employees/create/form";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CreateEmployeeT, NewOnboardingData } from "types";
import { toastError } from "utils";
import { toISOUTC } from "utils/convert";
import { ShortEmployeeBy } from "../components";

const AddEmployeeRequestView = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "GMT";

    const { data: request, isLoading: requestLoading } =
        requestsApi.useGetAddEmployeeRequestQuery(Number(id), {
            skip: !id,
        });

    const [updateRequest, { isLoading: updateLoading }] =
        requestsApi.useUpdateAddEmployeeRequestMutation();
    const [approveRequest, { isLoading: approveLoading }] =
        requestsApi.useApproveAddEmployeeRequestMutation();
    const [cancelRequest, { isLoading: cancelLoading }] =
        requestsApi.useCancelAddEmployeeRequestMutation();
    const [restoreRequest, { isLoading: restoreLoading }] =
        requestsApi.useRestoreAddEmployeeRequestMutation();

    const handleOnSubmit = (
        formData: CreateEmployeeT &
            Omit<NewOnboardingData, "start" | "end"> & {
                start: Date;
                end: Date;
            },
    ) => {
        if (!request) return;

        if (!formData.pool) {
            toast.error("Pool is a required field. Select a pool");
            return;
        }

        if (
            !formData.organization ||
            typeof formData.organization === "string"
        ) {
            toast.error(
                "Organization is a required field. Select a organization",
            );
            return;
        }

        const work_started = format(
            formData.work_started
                ? new Date(formData.work_started)
                : new Date(),
            "yyyy-MM-dd'T'HH:mm:ss+00:00",
        );

        const employee_data = {
            ...omit(formData, onboardingFields),
            work_started,
        } as CreateEmployeeT;

        const onboardingStart =
            typeof formData.start !== "string"
                ? toISOUTC(formData.start as unknown as Date, timezone)
                : formData.start;

        const onboardingEnd =
            typeof formData.end !== "string"
                ? toISOUTC(formData.end as unknown as Date, timezone)
                : formData.end;

        const onboarding_data = {
            ...pick(formData, onboardingFields),
            start: onboardingStart,
            end: onboardingEnd,
        } as NewOnboardingData;

        const data = {
            employee_data,
            onboarding_data,
        };

        updateRequest({ id: request.id, ...data })
            .unwrap()
            .then(() => {
                toast.success("Request successfully updated");
            })
            .catch((error) => toastError(error));
    };

    const handleApprove = (role: "hr" | "admin") => {
        if (!request) return;

        const confirmed = confirm(
            "Are you sure you want to approve the request?",
        );
        if (!confirmed) return;

        approveRequest({ id: request.id, role })
            .unwrap()
            .then(() => {
                toast.success("Request successfully approved as " + role);
                navigate("/requests?type=add-employee");
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
                navigate("/requests?type=add-employee");
            })
            .catch((error) => toastError(error));
    };

    const handleRestore = () => {
        if (!request) return;

        const confirmed = confirm(
            "Are you sure you want to restore the request?",
        );
        if (!confirmed) return;

        restoreRequest(request.id)
            .unwrap()
            .then(() => {
                toast.success("Request successfully restored");
            })
            .catch((error) => toastError(error));
    };

    if (requestLoading) return <LinearProgress />;

    if (!request) {
        return <Navigate to="/requests" />;
    }

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Typography variant="h6">Add employee request</Typography>

            <ShortEmployeeBy
                label="Created by:"
                employee={request.created_by}
            />
            {request.approved_by_hr && (
                <ShortEmployeeBy
                    label="Approved by HR:"
                    employee={request.approved_by_hr}
                />
            )}
            {request.approved_by_admin && (
                <ShortEmployeeBy
                    label="Approved by Support:"
                    employee={request.approved_by_admin}
                />
            )}

            <Typography>
                Updated:{" "}
                {formatInTimeZone(
                    request.updated + "+00:00",
                    timezone,
                    "dd MMMM yyyy - HH:mm:ss (O)",
                )}
            </Typography>

            <Box display="flex" flexDirection="column" alignItems="flex-start">
                {request.onboarding_data.youtrack_issue_id && (
                    <Link
                        href={
                            YOUTRACK_URL +
                            "/issue/" +
                            request.onboarding_data.youtrack_issue_id
                        }
                        target="_blank"
                        rel="noreferrer noopener"
                    >
                        Youtrack ticket -{" "}
                        {request.onboarding_data.youtrack_issue_id}
                    </Link>
                )}

                {request.onboarding_data.google_calendar_event_link && (
                    <Link
                        href={
                            request.onboarding_data.google_calendar_event_link
                        }
                        target="_blank"
                        rel="noreferrer noopener"
                    >
                        Google calendar event
                    </Link>
                )}
            </Box>

            <Divider />

            <EmployeeForm
                defaultValues={{
                    ...request.employee_data,
                    ...request.onboarding_data,
                    start: toZonedTime(request.onboarding_data.start, timezone),
                    end: toZonedTime(request.onboarding_data.end, timezone),
                }}
                onSubmit={handleOnSubmit}
                isLoading={updateLoading}
                disabled={!request.can_update}
            />

            <Box display="flex" gap={1}>
                {request.can_approve_admin && (
                    <LoadingButton
                        onClick={() => handleApprove("admin")}
                        variant="outlined"
                        size="small"
                        color="success"
                        loading={approveLoading}
                    >
                        Approve as Support
                    </LoadingButton>
                )}
                {request.can_approve_hr && (
                    <LoadingButton
                        onClick={() => handleApprove("hr")}
                        variant="outlined"
                        size="small"
                        color="success"
                        loading={approveLoading}
                    >
                        Approve as HR
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

                {request.can_restore && (
                    <LoadingButton
                        onClick={handleRestore}
                        variant="outlined"
                        size="small"
                        color="success"
                        loading={restoreLoading}
                    >
                        Restore
                    </LoadingButton>
                )}
            </Box>
        </Box>
    );
};

export { AddEmployeeRequestView };
