import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    Typography,
} from "@mui/material";
import {
    FormReduxSelectField,
    FormSelectEmployeeField,
    FormTextField,
} from "_components";
import { FormDatePickerField } from "_components/fields/datepicker";
import { employeesApi, requestsApi, useAppSelector } from "_redux";
import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { SelectOptionT } from "types/index";
import { CreateJoinTeamRequestT, Override } from "types/models";
import { toastError } from "utils";

type TeamJoinRequestDialogPropsT = {
    team_id: number;
    onClose: () => void;
};

type TeamInvitationRequestDialogPropsT = TeamJoinRequestDialogPropsT;

type TeamJoinRequestFormPropsT = {
    defaultValues: Override<
        CreateJoinTeamRequestT,
        { employee: SelectOptionT | null }
    >;
    onSubmit: () => void;
    can_change_employee: boolean;
    can_change_team: boolean;
};

const TeamJoinRequestForm: React.FC<TeamJoinRequestFormPropsT> = ({
    defaultValues,
    onSubmit,
    can_change_employee,
    can_change_team,
}) => {
    const [createTeamJoinRequest] =
        requestsApi.useCreateJoinTeamRequestMutation();

    const [submitButtonState, setSubmitButtonState] = useState<boolean>(true);

    const methods = useForm({ defaultValues });

    const handleSubmit = async (formData: any) => {
        setSubmitButtonState(false);
        createTeamJoinRequest({ data: formData })
            .unwrap()
            .then(() => {
                toast.success(
                    "Request to join the team has been successfully created",
                );
                onSubmit();
            })
            .catch((error) => toastError(error));
    };

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Typography>Join team request</Typography>
            <FormProvider {...methods}>
                <form
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                    onSubmit={methods.handleSubmit(handleSubmit)}
                >
                    <Box hidden>
                        <FormControl fullWidth>
                            <FormDatePickerField
                                name="date"
                                control={methods.control}
                                label="Date"
                                rules={{ required: true }}
                                helperText="The date when join team"
                                disabled
                            />
                        </FormControl>
                    </Box>

                    <FormControl variant="standard">
                        <FormSelectEmployeeField
                            name="employee"
                            control={methods.control}
                            rules={{ required: true }}
                            label="Person"
                            optionsLoadFn={
                                employeesApi.useListEmployeeSelectQuery
                            }
                            isDisabled={!can_change_employee}
                        />
                    </FormControl>

                    <FormControl fullWidth>
                        <FormReduxSelectField
                            name="team"
                            label="Team"
                            rules={{ required: true }}
                            control={methods.control}
                            optionsLoadFn={employeesApi.useListTeamSelectQuery}
                            isDisabled={!can_change_team}
                        />
                    </FormControl>

                    <FormControl fullWidth>
                        <FormTextField
                            register={methods.register}
                            name="message"
                            label="Message (comment)"
                            rules={{ required: true }}
                            multiline
                            rows={3}
                        />
                    </FormControl>

                    <Button
                        sx={{ alignSelf: "flex-start" }}
                        type="submit"
                        variant="outlined"
                        disabled={!submitButtonState}
                    >
                        Send request
                    </Button>
                </form>
            </FormProvider>
        </Box>
    );
};

export const TeamJoinRequestDialog: React.FC<TeamJoinRequestDialogPropsT> = ({
    team_id,
    onClose,
}) => {
    const { data, error, isLoading, isUninitialized, isError } =
        employeesApi.useGetTeamQuery({ id: team_id });

    const profile = useAppSelector(({ profile }) => profile.payload);

    if (isUninitialized || isLoading)
        return <CircularProgress color="success" />;

    if (isError)
        return (
            <Box>
                <p>{`Error: ${JSON.stringify(error)}`}</p>
            </Box>
        );

    const defaultValues = {
        employee: { value: profile.id, label: profile.english_name },
        team: { value: team_id, label: data.payload.name },
        date: new Date(),
        message: "",
    };

    return (
        <TeamJoinRequestForm
            defaultValues={defaultValues}
            onSubmit={onClose}
            can_change_employee={false}
            can_change_team={false}
        />
    );
};

export const TeamInvitationRequestDialog: React.FC<
    TeamInvitationRequestDialogPropsT
> = ({ team_id, onClose }) => {
    const { data, error, isLoading, isUninitialized, isError } =
        employeesApi.useGetTeamQuery({ id: team_id });
    if (isUninitialized || isLoading)
        return <CircularProgress color="success" />;
    if (isError)
        return (
            <Box>
                <p>{`Error: ${JSON.stringify(error)}`}</p>
            </Box>
        );
    const defaultValues = {
        employee: null,
        team: { value: team_id, label: data.payload.name },
        date: new Date(),
        message: "",
    };
    return (
        <TeamJoinRequestForm
            defaultValues={defaultValues}
            onSubmit={onClose}
            can_change_employee={true}
            can_change_team={false}
        />
    );
};
