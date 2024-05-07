import { Box, Typography } from "@mui/material";
import { requestsApi, useAppSelector } from "_redux";
import { onboardingFields } from "config";
import { omit, pick } from "lodash";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CreateEmployeeT, NewOnboardingData } from "types";
import { toastError } from "utils";
import { formatDateYYYYMMDD, toISOUTC } from "utils/convert";
import { EmployeeForm } from "./form";

const EmployeeCreate = () => {
    const navigate = useNavigate();

    const profile = useAppSelector((state) => state.profile.payload);
    const hasAccess = [
        "hr",
        "recruiter",
        "admin",
        "super_hr",
        "super_admin",
    ].some((role) => profile.roles?.includes(role));

    if (!hasAccess) return <Navigate to="/not-found" />;

    const timezone = profile.timezone || "UTC";

    const [createAddEmployeeRequest, { isLoading }] =
        requestsApi.useCreateAddEmployeeRequestMutation();

    const handleOnSubmit = (
        formData: CreateEmployeeT &
            Omit<NewOnboardingData, "start" | "end"> & {
                start: Date;
                end: Date;
            },
    ) => {
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

        const work_started = formData.work_started
            ? formatDateYYYYMMDD(formData.work_started)
            : null;

        const employee_data = {
            ...omit(formData, onboardingFields),
            work_started,
        } as CreateEmployeeT;

        const onboarding_data = {
            ...pick(formData, onboardingFields),
            start: toISOUTC(formData.start, timezone),
            end: toISOUTC(formData.end, timezone),
        } as NewOnboardingData;

        const data = {
            employee_data,
            onboarding_data,
        };

        createAddEmployeeRequest(data)
            .unwrap()
            .then((res) => {
                toast.success("Add new employee request successfully created");
                navigate(`/requests/add-employee/${res.payload.id}`);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="h6">
                Create request to add new person
            </Typography>

            <EmployeeForm
                onSubmit={handleOnSubmit}
                isLoading={isLoading}
                showExisting
            />
        </Box>
    );
};

export { EmployeeCreate };
