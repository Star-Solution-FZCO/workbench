import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from "@mui/material";
import { FormReduxListSelectField, FormReduxSelectField } from "_components";
import { FormSwitchField } from "_components/fields/switch";
import { catalogsApi, employeesApi } from "_redux";
import { FC, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { CounteragentT } from "types";
import { generateCred } from "utils";
import { CounteragentFormData, counteragentSchema } from "../utils";
import { ContactsEditField } from "./contacts_field";

interface ICounteragentFormProps {
    initialValues?: CounteragentT;
    onSubmit: (formData: CounteragentFormData) => void;
    loading?: boolean;
    disabled?: boolean;
}

const CreateCounteragentForm: FC<ICounteragentFormProps> = ({
    initialValues,
    onSubmit,
    loading,
    disabled,
}) => {
    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: initialValues || {
            group: false,
            team_required: false,
            agents: [],
            username: null,
            schedule: "every_month",
        },
        resolver: yupResolver(counteragentSchema),
    });

    const handleChangeEnglishName = (value: string) => {
        setValue("english_name", value);
        setValue("username", generateCred(value, "."));
    };

    useEffect(() => {
        if (errors.contacts) {
            toast.error("Contacts are required");
        }
    }, [errors]);

    return (
        <Box
            component="form"
            display="flex"
            flexDirection="column"
            gap={1}
            onSubmit={handleSubmit(onSubmit)}
        >
            <TextField
                {...register("english_name")}
                label="English name"
                onChange={(e) => handleChangeEnglishName(e.target.value)}
                error={!!errors.english_name}
                helperText={errors.english_name?.message}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: disabled }}
            />

            <TextField
                {...register("username")}
                label="Username"
                error={!!errors.username}
                helperText={errors.username?.message}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: disabled }}
            />

            <TextField
                {...register("email")}
                label="E-mail"
                error={!!errors.email}
                helperText={errors.email?.message}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: disabled }}
            />

            <InputLabel>Contacts</InputLabel>

            <ContactsEditField
                name="contacts"
                value={initialValues?.contacts || []}
                setValue={setValue}
            />

            <FormReduxSelectField
                control={control}
                name="manager"
                label="Manager"
                optionsLoadFn={employeesApi.useListEmployeeSelectQuery}
                isDisabled={disabled}
            />

            <FormReduxSelectField
                control={control}
                name="organization"
                label="Organization"
                optionsLoadFn={catalogsApi.useListOrganizationSelectQuery}
                isDisabled={disabled}
                isClearable
            />

            <FormSwitchField
                control={control}
                label="Show in team"
                name="team_required"
            />

            {watch("team_required") && (
                <FormReduxSelectField
                    control={control}
                    name="team"
                    label="Team"
                    optionsLoadFn={employeesApi.useListTeamSelectQuery}
                    isDisabled={disabled}
                    isClearable
                />
            )}

            <Controller
                name="schedule"
                control={control}
                render={({ field: { value, onChange } }) => (
                    <FormControl sx={{ mt: 1 }}>
                        <InputLabel id="schedule">
                            Agent validation schedule
                        </InputLabel>
                        <Select
                            labelId="schedule"
                            label="Agent validation schedule"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                        >
                            <MenuItem value="every_month">Every month</MenuItem>
                            <MenuItem value="every_3_month">
                                Every 3 month
                            </MenuItem>
                            <MenuItem value="every_6_month">
                                Every 6 month
                            </MenuItem>
                        </Select>
                    </FormControl>
                )}
            />

            <FormSwitchField control={control} label="Group" name="group" />

            {watch("group") ? (
                <>
                    <FormReduxListSelectField
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        control={control}
                        name="agents"
                        label="Subagents"
                        optionsLoadFn={
                            employeesApi.useListCounteragentSelectQuery
                        }
                        disabled={disabled}
                        clearable
                    />

                    <FormSwitchField
                        control={control}
                        label="Apply to all subagents"
                        name="apply_subagents"
                    />
                </>
            ) : (
                <FormReduxSelectField
                    control={control}
                    name="parent"
                    label="Parent"
                    optionsLoadFn={employeesApi.useListCounteragentSelectQuery}
                    isDisabled={disabled}
                    isClearable
                />
            )}

            <LoadingButton
                type="submit"
                variant="outlined"
                loading={loading}
                disabled={disabled}
            >
                Save
            </LoadingButton>
        </Box>
    );
};

export { CreateCounteragentForm };
