import { Box, Divider, Typography } from "@mui/material";
import { FormRow } from "_components/fields";
import { catalogsApi, employeesApi, sharedApi } from "_redux";
import { FC, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { ApiResponse, EmployeeT, UpdateEmployeeT } from "types";
import { checkFieldCanBeEdited } from "utils";
import DatePickerField from "./datepicker_field";
import EmployeeListField from "./employee_list";
import FieldWrapper from "./field_wrapper";
import GradeField from "./grade_field";
import { EmployeeLinkedAccounts } from "./linked_accounts";
import MultilineTextfield from "./multiline_textfield";
import ProbationPeriodField from "./probation_period_field";
import SelectField from "./select_field";
import SelectListField from "./select_list_field";
import TimeRangeField from "./time_range_field";
import WorkChatListField from "./work_chat_list_field";

const EmployeeForm: FC<{
    data: ApiResponse<EmployeeT>;
}> = ({ data: responseData }) => {
    const { metadata, payload: data } = responseData;

    const [editMode, setEditMode] = useState({
        availability_time: false,
        contract_date: false,
        grade: false,
        managers: false,
        mentors: false,
        organization: false,
        position: false,
        roles: false,
        team: false,
        timezone: false,
        work_ended: false,
        work_started: false,
        cooperation_type: false,
        probation_period_started: false,
        dismissal_reason: false,
        pool: false,
    });

    const methods = useForm<UpdateEmployeeT>({
        defaultValues: data,
        mode: "onBlur",
    });

    const changeEditMode = (field: keyof typeof editMode) => {
        setEditMode({ ...editMode, [field]: !editMode[field] });
    };

    // reset form default values when data props changed
    useEffect(() => {
        if (data) {
            methods.reset(data);
        }
    }, [data, methods]);

    return (
        <FormProvider {...methods}>
            <form>
                <Box
                    display="flex"
                    flexDirection="column"
                    gap={0.5}
                    width="650px"
                >
                    <MultilineTextfield
                        label="About"
                        name="about"
                        value={data.about}
                        metadata={metadata}
                    />

                    <FieldWrapper
                        label="Name in English"
                        name="english_name"
                        value={data.english_name}
                        helperText="First name 'Nickname' Last name"
                        canBeEdited={checkFieldCanBeEdited(
                            "english_name",
                            metadata,
                        )}
                    />

                    <FieldWrapper
                        label="Native name"
                        name="native_name"
                        value={data.native_name}
                        canBeEdited={checkFieldCanBeEdited(
                            "native_name",
                            metadata,
                        )}
                    />

                    <Divider flexItem />

                    <FieldWrapper
                        label="Account"
                        name="account"
                        value={data.account}
                        canBeEdited={checkFieldCanBeEdited("account", metadata)}
                    />

                    <FieldWrapper
                        label="Email"
                        name="email"
                        value={data.email}
                        canBeEdited={checkFieldCanBeEdited("email", metadata)}
                    />

                    <FieldWrapper
                        label="Pararam"
                        name="pararam"
                        value={data.pararam}
                        canBeEdited={checkFieldCanBeEdited("pararam", metadata)}
                    />

                    <FieldWrapper
                        label="Public contacts"
                        name="public_contacts"
                        value={data.public_contacts}
                        canBeEdited={checkFieldCanBeEdited(
                            "public_contacts",
                            metadata,
                        )}
                    />

                    <Divider sx={{ mt: 0.5 }} flexItem />

                    <EmployeeListField
                        label="Managers"
                        name="managers"
                        data={data.managers}
                        metadata={metadata}
                        editMode={editMode["managers"]}
                        onChangeEditMode={() => changeEditMode("managers")}
                        optionsLoadFn={
                            employeesApi.useListEmployeeUpdateManagersSelectQuery
                        }
                    />

                    <EmployeeListField
                        label="Mentors"
                        name="mentors"
                        data={data.mentors}
                        metadata={metadata}
                        editMode={editMode["mentors"]}
                        onChangeEditMode={() => changeEditMode("mentors")}
                        optionsLoadFn={
                            employeesApi.useListEmployeeUpdateMentorsSelectQuery
                        }
                    />

                    <SelectField
                        label={"Team"}
                        name="team"
                        data={data.team}
                        metadata={metadata}
                        optionsLoadFn={employeesApi.useListTeamSelectQuery}
                        editMode={editMode["team"]}
                        onChangeEditMode={() => changeEditMode("team")}
                    />

                    <FormRow label="Projects">
                        <Box display="flex" flexDirection="column">
                            {data.projects.map((project) => (
                                <Typography key={project}>{project}</Typography>
                            ))}
                        </Box>
                    </FormRow>

                    <FieldWrapper
                        label={"Team role"}
                        name="team_position"
                        value={data.team_position}
                        canBeEdited={checkFieldCanBeEdited(
                            "team_position",
                            metadata,
                        )}
                    />

                    <SelectField
                        label={"Position"}
                        name="position"
                        data={data.position}
                        metadata={metadata}
                        optionsLoadFn={catalogsApi.useListPositionSelectQuery}
                        editMode={editMode["position"]}
                        onChangeEditMode={() => changeEditMode("position")}
                    />

                    {data.roles && (
                        <SelectListField
                            label={"Roles"}
                            name="roles"
                            data={data.roles}
                            metadata={metadata}
                            optionsLoadFn={
                                employeesApi.useListEmployeeRoleSelectQuery
                            }
                            editMode={editMode["roles"]}
                            onChangeEditMode={() => changeEditMode("roles")}
                        />
                    )}

                    <Divider sx={{ mb: 0.5 }} flexItem />

                    <DatePickerField
                        label="Start to work"
                        name="work_started"
                        value={data.work_started}
                        metadata={metadata}
                        editMode={editMode["work_started"]}
                        onChangeEditMode={() => changeEditMode("work_started")}
                    />

                    <DatePickerField
                        label="Stopped working"
                        name="work_ended"
                        value={data.work_ended}
                        metadata={metadata}
                        editMode={editMode["work_ended"]}
                        onChangeEditMode={() => changeEditMode("work_ended")}
                    />

                    {data.dismissal_reason !== undefined && (
                        <MultilineTextfield
                            label="Dismissal reason"
                            name="dismissal_reason"
                            value={data.dismissal_reason}
                            metadata={metadata}
                        />
                    )}

                    <TimeRangeField
                        label="Availability time"
                        name="availability_time"
                        value={data.availability_time}
                        metadata={metadata}
                        editMode={editMode["availability_time"]}
                        onChangeEditMode={() =>
                            changeEditMode("availability_time")
                        }
                    />

                    <SelectField
                        label="Timezone"
                        name="timezone"
                        data={data.timezone}
                        metadata={metadata}
                        optionsLoadFn={sharedApi.useListTimezoneSelectQuery}
                        editMode={editMode["timezone"]}
                        onChangeEditMode={() => changeEditMode("timezone")}
                    />

                    {"grade" in data && (
                        <GradeField value={data.grade} metadata={metadata} />
                    )}

                    {data.organization !== undefined && (
                        <SelectField
                            label={"Organization"}
                            name="organization"
                            data={data.organization}
                            metadata={metadata}
                            optionsLoadFn={
                                catalogsApi.useListOrganizationSelectQuery
                            }
                            editMode={editMode["organization"]}
                            onChangeEditMode={() =>
                                changeEditMode("organization")
                            }
                        />
                    )}
                    {data.cooperation_type !== undefined && (
                        <SelectField
                            label={"Cooperation type"}
                            name="cooperation_type"
                            data={data.cooperation_type}
                            metadata={metadata}
                            optionsLoadFn={
                                catalogsApi.useListCooperationTypeSelectQuery
                            }
                            editMode={editMode["cooperation_type"]}
                            onChangeEditMode={() =>
                                changeEditMode("cooperation_type")
                            }
                        />
                    )}
                    {data.contract_date !== undefined && (
                        <DatePickerField
                            label="Contract date"
                            name="contract_date"
                            value={data.contract_date}
                            metadata={metadata}
                            editMode={editMode["contract_date"]}
                            onChangeEditMode={() =>
                                changeEditMode("contract_date")
                            }
                        />
                    )}

                    {data.probation_period_started !== undefined &&
                        data.probation_period_ended !== undefined &&
                        data.probation_period_justification !== undefined && (
                            <ProbationPeriodField
                                probation_period_started={
                                    data.probation_period_started
                                }
                                probation_period_ended={
                                    data.probation_period_ended
                                }
                                probation_period_justification={
                                    data.probation_period_justification
                                }
                                metadata={metadata}
                            />
                        )}

                    {data.work_notifications_chats && (
                        <WorkChatListField
                            label="Pararam notification chat IDs"
                            name="work_notifications_chats"
                            value={data.work_notifications_chats}
                            metadata={metadata}
                        />
                    )}

                    {data.pool !== undefined && (
                        <SelectField
                            label={"Pool"}
                            name="pool"
                            data={data.pool}
                            metadata={metadata}
                            optionsLoadFn={
                                catalogsApi.useListEmployeePoolSelectQuery
                            }
                            editMode={editMode["pool"]}
                            onChangeEditMode={() => changeEditMode("pool")}
                        />
                    )}

                    {data.linked_accounts.length > 0 && (
                        <>
                            <Divider sx={{ mb: 0.5 }} flexItem />

                            <EmployeeLinkedAccounts
                                accounts={data.linked_accounts}
                            />
                        </>
                    )}
                </Box>
            </form>
        </FormProvider>
    );
};

export default EmployeeForm;
