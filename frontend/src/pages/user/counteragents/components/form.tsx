import { Box, Divider } from "@mui/material";
import { FormRow } from "_components";
import { catalogsApi, employeesApi, useAppSelector } from "_redux";
import { FC, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { CounteragentT, UpdateCounteragentT } from "types";
import ContactsField from "./contacts_field";
import FormFieldWrapper from "./form_field_wrapper";
import ReduxSelectField from "./redux_select_field";
import SelectField from "./select_field";
import SwitchField from "./switch";

const CounteragentForm: FC<{ data: CounteragentT }> = ({ data }) => {
    const profile = useAppSelector((state) => state.profile.payload);

    const [editMode, setEditMode] = useState({
        contacts: false,
        manager: false,
        organization: false,
        team: false,
        team_required: false,
        parent: false,
        group: false,
        schedule: false,
    });

    const methods = useForm<UpdateCounteragentT>({
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

    const canEdit = data.can_edit;

    return (
        <FormProvider {...methods}>
            <form>
                <Box
                    display="flex"
                    flexDirection="column"
                    gap="4px"
                    width="650px"
                >
                    <FormFieldWrapper
                        label="Name in English"
                        name="english_name"
                        value={data.english_name}
                        helperText="First name Last name"
                        editable={canEdit}
                    />

                    <FormFieldWrapper
                        label="Username"
                        name="username"
                        value={data.username}
                        editable={
                            canEdit && profile.roles?.includes("super_admin")
                        }
                    />

                    <FormFieldWrapper
                        label="Email"
                        name="email"
                        value={data.email}
                        editable={canEdit}
                    />

                    {canEdit && (
                        <ContactsField
                            value={data.contacts}
                            label="Contacts"
                            name="contacts"
                            editable={canEdit}
                            editMode={editMode["contacts"]}
                            onChangeEditMode={() => changeEditMode("contacts")}
                        />
                    )}

                    <FormRow label="Status">{data.status}</FormRow>

                    <Divider flexItem />

                    <ReduxSelectField
                        label="Manager"
                        name="manager"
                        data={data.manager}
                        optionsLoadFn={employeesApi.useListEmployeeSelectQuery}
                        editMode={editMode["manager"]}
                        onChangeEditMode={() => changeEditMode("manager")}
                        editable={canEdit}
                    />

                    <ReduxSelectField
                        label="Organization"
                        name="organization"
                        data={data.organization}
                        optionsLoadFn={
                            catalogsApi.useListOrganizationSelectQuery
                        }
                        editMode={editMode["organization"]}
                        onChangeEditMode={() => changeEditMode("organization")}
                        editable={canEdit}
                    />

                    <ReduxSelectField
                        label="Team"
                        name="team"
                        data={data.team}
                        optionsLoadFn={employeesApi.useListTeamSelectQuery}
                        editMode={editMode["team"]}
                        onChangeEditMode={() => changeEditMode("team")}
                        editable={canEdit}
                    />

                    <SwitchField
                        label="Show in team"
                        name="team_required"
                        editable={canEdit}
                        editMode={editMode["team_required"]}
                        value={data.team_required}
                        onChangeEditMode={() => changeEditMode("team_required")}
                    />

                    <SwitchField
                        label="Group"
                        name="group"
                        editable={canEdit}
                        editMode={editMode["group"]}
                        value={data.team_required}
                        onChangeEditMode={() => changeEditMode("group")}
                    />

                    <ReduxSelectField
                        label="Parent agent"
                        name="parent"
                        data={data.parent}
                        optionsLoadFn={
                            employeesApi.useListCounteragentSelectQuery
                        }
                        editMode={editMode["parent"]}
                        onChangeEditMode={() => changeEditMode("parent")}
                        editable={canEdit}
                    />

                    <SelectField
                        label="Agent validation schedule"
                        value={data.schedule}
                        name="schedule"
                        options={[
                            { value: "every_month", label: "Every month" },
                            { value: "every_3_month", label: "Every 3 month" },
                            { value: "every_6_month", label: "Every 6 month" },
                        ]}
                        editable={canEdit}
                        editMode={editMode["schedule"]}
                        onChangeEditMode={() => changeEditMode("schedule")}
                    />
                </Box>
            </form>
        </FormProvider>
    );
};

export { CounteragentForm };
