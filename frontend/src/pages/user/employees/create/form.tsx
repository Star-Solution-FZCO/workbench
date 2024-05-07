import { LoadingButton } from "@mui/lab";
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import {
    DateTimePicker,
    DateTimeValidationError,
    PickerChangeHandlerContext,
} from "@mui/x-date-pickers";
import {
    Employee,
    EmployeeFormReduxListSelectField,
    FormReduxSelectField,
    FormTextField,
} from "_components";
import { FormDatePickerField } from "_components/fields/datepicker";
import { catalogsApi, employeesApi, requestsApi, useAppSelector } from "_redux";
import { DEFAULT_EMAIL_DOMAIN } from "config";
import { addHours } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { upperFirst } from "lodash";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
    Controller,
    FieldErrorsImpl,
    FormProvider,
    UseFormRegister,
    UseFormSetValue,
    useForm,
    useFormContext,
} from "react-hook-form";
import { CreateEmployeeT, NewOnboardingData } from "types";
import {
    englishNameRegExp,
    genRules,
    generateCred,
    tr,
    validateEmail,
} from "utils";

export const initialValues: CreateEmployeeT = {
    english_name: "",
    native_name: null,
    team: null,
    team_position: null,
    photo: null,
    managers: [],
    mentors: [],
    email: "",
    account: "",
    active: true,
    about: "",
    work_started: null,
    birthday: null,
    position: null,
    roles: [],
    pararam: "",
};

export type EmployeeFormPropsT = {
    register: UseFormRegister<any>;
    errors: FieldErrorsImpl;
    control: any;
    setValue: UseFormSetValue<any>;
    onInputChange?: (
        event: React.ChangeEvent<HTMLInputElement>,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
    ) => void;
    data?: {
        photo: string | null | undefined;
        account: string;
    };
    isLoading?: boolean;
    disabled?: boolean;
    showExisting?: boolean;
};

const EmployeeFormBase: React.FC<EmployeeFormPropsT> = ({
    register,
    errors,
    control,
    onInputChange,
    data,
    isLoading,
    disabled,
    showExisting,
}) => {
    const profile = useAppSelector((state) => state.profile.payload);

    const { setValue, watch } = useFormContext();

    const [accountLength, setAccountLength] = useState(0);

    const { data: settings } = requestsApi.useGetEmployeeRequestSettingsQuery();
    const { data: existing_persons } = employeesApi.useListEmployeeSelectQuery(
        watch("account"),
    );

    const handleChangeOnboardingStart = (
        value: Date | null,
        context: PickerChangeHandlerContext<DateTimeValidationError>,
    ) => {
        setValue("start", value);

        if (value && !context.validationError) {
            const hours = settings?.payload?.duration || 1;
            setValue("end", addHours(value, hours));
        }
    };

    const renderAccount = useMemo(
        () =>
            data ? (
                <TextField
                    value={data.account}
                    label="Account"
                    variant="outlined"
                    helperText={`Length: ${data.account.length}`}
                    disabled
                />
            ) : (
                <FormTextField
                    name="account"
                    label="Account"
                    register={register}
                    changeHandler={onInputChange}
                    errors={errors}
                    rules={genRules({
                        required: true,
                        minLength: 2,
                        maxLength: 20,
                    })}
                    helperText={`Length: ${accountLength}. Max length is 20 chars`}
                    variant="outlined"
                    disabled={disabled}
                />
            ),
        [accountLength, data, disabled, errors, onInputChange, register],
    );

    useEffect(() => {
        setAccountLength(watch("account").length);
    }, [watch("account")]);

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="flex-start"
            maxWidth="1500px"
            gap={1}
        >
            <Box display="flex" gap={2} width="100%">
                <Box display="flex" flexDirection="column" flex={2} gap={1}>
                    <InputLabel>Main info</InputLabel>

                    <FormTextField
                        name="native_name"
                        label="Native Name (First name Last name)"
                        placeholder="First name Last name"
                        changeHandler={onInputChange}
                        register={register}
                        errors={errors}
                        variant="outlined"
                        disabled={disabled}
                    />

                    <FormTextField
                        name="english_name"
                        label="Name in English (First name 'Nickname' Last name)"
                        register={register}
                        changeHandler={onInputChange}
                        errors={errors}
                        rules={{
                            ...genRules({ required: true, minLength: 2 }),
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            pattern: {
                                // eslint-disable-next-line no-control-regex
                                value: englishNameRegExp,
                                message:
                                    "English name must contain only Latin characters (numbers and special characters ._- allowed in the nickname)",
                            },
                        }}
                        variant="outlined"
                        disabled={disabled}
                    />

                    {renderAccount}

                    <FormTextField
                        name="email"
                        label="E-Mail"
                        register={register}
                        changeHandler={onInputChange}
                        errors={errors}
                        rules={{
                            ...genRules({
                                required: true,
                                minLength: 2,
                                validate: validateEmail,
                            }),
                        }}
                        variant="outlined"
                        disabled={disabled}
                    />

                    <FormTextField
                        name="pararam"
                        label="Pararam"
                        register={register}
                        changeHandler={onInputChange}
                        errors={errors}
                        rules={{
                            ...genRules({
                                required: true,
                                minLength: 2,
                            }),
                            //eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            //@ts-ignore
                            pattern: {
                                // eslint-disable-next-line no-control-regex
                                value: new RegExp("^[a-z0-9_]*$"),
                                message: "Not a valid pararam",
                            },
                        }}
                        variant="outlined"
                        disabled={disabled}
                    />

                    <FormDatePickerField
                        name="work_started"
                        label="Start to work"
                        control={control}
                        rules={{ required: true }}
                        errors={errors}
                        helperText="The date on which the person starts work"
                        disabled={disabled}
                    />
                </Box>

                <Box display="flex" flexDirection="column" flex={2} gap={1}>
                    <EmployeeFormReduxListSelectField
                        name="managers"
                        label="Managers"
                        clearable
                        optionsLoadFn={employeesApi.useListEmployeeSelectQuery}
                    />

                    <EmployeeFormReduxListSelectField
                        name="mentors"
                        label="Mentors"
                        clearable
                        optionsLoadFn={employeesApi.useListEmployeeSelectQuery}
                    />

                    <FormReduxSelectField
                        name="organization"
                        label="Organization"
                        control={control}
                        optionsLoadFn={
                            catalogsApi.useListOrganizationSelectQuery
                        }
                        required
                    />

                    <FormReduxSelectField
                        name="position"
                        label="Position"
                        control={control}
                        optionsLoadFn={catalogsApi.useListPositionSelectQuery}
                    />

                    <FormReduxSelectField
                        name="team"
                        label="Team"
                        control={control}
                        optionsLoadFn={employeesApi.useListTeamSelectQuery}
                    />

                    <FormReduxSelectField
                        name="holiday_set"
                        label="Holiday set"
                        control={control}
                        optionsLoadFn={catalogsApi.useListHolidaySetSelectQuery}
                    />

                    <FormReduxSelectField
                        name="pool"
                        label="Pool"
                        control={control}
                        optionsLoadFn={
                            catalogsApi.useListEmployeePoolSelectQuery
                        }
                        required
                    />
                </Box>

                <Box display="flex" flexDirection="column" flex={3} gap={1}>
                    <InputLabel>Onboading meeting</InputLabel>

                    <Typography>
                        Timezone:{" "}
                        <Typography component="span" fontWeight={500}>
                            {profile.timezone || "UTC"}{" "}
                            {formatInTimeZone(
                                new Date(),
                                profile.timezone || "UTC",
                                "OOOO",
                            )}
                        </Typography>
                    </Typography>

                    <Box display="flex" gap={1}>
                        <Controller
                            name="start"
                            control={control}
                            render={({ field: { value } }) => (
                                <DateTimePicker
                                    label="Start"
                                    value={
                                        typeof value === "string"
                                            ? toZonedTime(value, "UTC")
                                            : value
                                    }
                                    onChange={handleChangeOnboardingStart}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                        },
                                    }}
                                    disabled={disabled}
                                />
                            )}
                        />

                        <Controller
                            name="end"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <DateTimePicker
                                    label="End"
                                    value={
                                        typeof value === "string"
                                            ? toZonedTime(value, "UTC")
                                            : value
                                    }
                                    onChange={onChange}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                        },
                                    }}
                                    disabled={disabled}
                                />
                            )}
                        />
                    </Box>

                    <Controller
                        name="work_mode"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <FormControl fullWidth>
                                <InputLabel id="work_mode" required>
                                    Work mode
                                </InputLabel>
                                <Select
                                    labelId="work_mode"
                                    label="Work mode"
                                    value={value}
                                    onChange={onChange}
                                    disabled={disabled}
                                    required
                                    fullWidth
                                >
                                    <MenuItem value="office">Office</MenuItem>
                                    <MenuItem value="remote">Remote</MenuItem>
                                    <MenuItem value="hybrid">Hybrid</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                    />

                    <FormTextField
                        name="contacts"
                        label="Contacts for invite (email, messenger, etc)"
                        register={register}
                        changeHandler={onInputChange}
                        errors={errors}
                        variant="outlined"
                        disabled={disabled}
                    />

                    <FormTextField
                        name="description"
                        label="Description"
                        register={register}
                        changeHandler={onInputChange}
                        errors={errors}
                        variant="outlined"
                        helperText="Google calendar event & YouTrack ticket description"
                        multiline
                        rows={5}
                        disabled={disabled}
                    />
                </Box>
            </Box>

            <FormTextField
                name="comment"
                label="Comment"
                register={register}
                changeHandler={onInputChange}
                errors={errors}
                variant="outlined"
                multiline
                rows={4}
                disabled={disabled}
                fullWidth
            />

            <LoadingButton
                type="submit"
                variant="outlined"
                size="small"
                loading={isLoading}
                disabled={
                    disabled ||
                    (existing_persons && existing_persons?.length > 0)
                }
            >
                Save
            </LoadingButton>

            {showExisting &&
                watch("account") &&
                existing_persons &&
                existing_persons.length > 0 && (
                    <Box display="flex" flexDirection="column" gap={0.5}>
                        <Typography>
                            {existing_persons.length} existing persons
                        </Typography>
                        {existing_persons.map((person) => (
                            <Employee
                                employee={{
                                    id: person.value as number,
                                    english_name: person.label,
                                    pararam: person.pararam || "",
                                }}
                            />
                        ))}
                    </Box>
                )}
        </Box>
    );
};

export interface IEmployeeFormProps {
    defaultValues?: CreateEmployeeT & NewOnboardingData;
    onSubmit: (
        data: CreateEmployeeT &
            Omit<NewOnboardingData, "start" | "end"> & {
                start: Date;
                end: Date;
            },
    ) => void;
    isLoading?: boolean;
    disabled?: boolean;
    showExisting?: boolean;
}

const EmployeeForm: FC<IEmployeeFormProps> = ({
    defaultValues = initialValues,
    onSubmit,
    isLoading,
    disabled,
    showExisting,
}) => {
    const methods = useForm<
        CreateEmployeeT &
            Omit<NewOnboardingData, "start" | "end"> & {
                start: Date;
                end: Date;
            }
    >({
        reValidateMode: "onBlur",
        defaultValues,
    });

    const {
        control,
        handleSubmit,
        setValue,
        getValues,
        formState: { errors },
        register,
        getFieldState,
    } = methods;

    const handleFieldSetValue = useCallback(
        (
            name: "english_name" | "account" | "email" | "pararam",
            value: string,
        ) => {
            const { isDirty } = getFieldState(name);
            if (!isDirty) setValue(name, value);
        },
        [getFieldState, setValue],
    );

    const getAccountName = useCallback(
        (value: string | undefined = "", key: "english_name" | undefined) => {
            const english_name =
                key === "english_name" ? value : getValues("english_name");
            let cred = generateCred(english_name, ".");

            if (cred.length > 20) {
                const splitted = cred.split(".");
                const last = splitted.pop();
                if (last) {
                    cred = [...splitted.map((el) => el[0]), last].join(".");
                }
            }
            return cred;
        },
        [getValues],
    );

    const getPararamName = useCallback(
        (value: string | undefined = "", key: "english_name" | undefined) => {
            const english_name =
                key === "english_name" ? value : getValues("english_name");
            return generateCred(english_name, "_");
        },
        [getValues],
    );

    const handleFieldChange = useCallback(
        (
            event: React.ChangeEvent<HTMLInputElement>,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
        ) => {
            const trimmed = event.target.value
                .trimStart()
                .replace(/\s\s+/g, " ");
            switch (event.target.name) {
                case "native_name":
                    event.target.value = upperFirst(trimmed);
                    handleFieldSetValue("english_name", tr(event.target.value));
                    handleFieldSetValue(
                        "account",
                        getAccountName(undefined, undefined),
                    );
                    handleFieldSetValue(
                        "email",
                        `${getAccountName(
                            undefined,
                            undefined,
                        )}@${DEFAULT_EMAIL_DOMAIN}`,
                    );
                    handleFieldSetValue(
                        "pararam",
                        getPararamName(undefined, undefined),
                    );
                    break;
                case "english_name":
                    event.target.value = upperFirst(trimmed);
                    handleFieldSetValue(
                        "account",
                        getAccountName(event.target.value, "english_name"),
                    );
                    handleFieldSetValue(
                        "email",
                        `${getAccountName(
                            event.target.value,
                            "english_name",
                        )}@${DEFAULT_EMAIL_DOMAIN}`,
                    );
                    handleFieldSetValue(
                        "pararam",
                        getPararamName(event.target.value, "english_name"),
                    );
                    break;
                case "account":
                    handleFieldSetValue(
                        "email",
                        `${event.target.value}@${DEFAULT_EMAIL_DOMAIN}`,
                    );
                    handleFieldSetValue("pararam", event.target.value);
                    break;
                default:
                    break;
            }
            onChange(event);
        },
        [getAccountName, getPararamName, handleFieldSetValue],
    );

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <EmployeeFormBase
                    register={register}
                    // @ts-ignore
                    errors={errors}
                    control={control}
                    setValue={setValue}
                    onInputChange={handleFieldChange}
                    isLoading={isLoading}
                    disabled={disabled}
                    showExisting={showExisting}
                />
            </form>
        </FormProvider>
    );
};

export { EmployeeForm };
