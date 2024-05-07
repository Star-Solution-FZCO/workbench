/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Box, CircularProgress } from "@mui/material";
import {
    FormReduxSelectField,
    FormTextField,
    ModalForm,
    MultipleTagFormSelectField,
    RichTextEditor,
} from "_components";
import { ManagerView } from "_components/views/manager";
import { catalogsApi, employeesApi } from "_redux";
import React from "react";
import { useForm } from "react-hook-form";
import { OptionProps, components } from "react-select";
import { toast } from "react-toastify";
import { EmployeeSelectOptionT, NewTeamT, Override, TeamT } from "types/models";
import { genRules, toastError } from "utils";

const ManagerOption = (props: OptionProps<EmployeeSelectOptionT>) => {
    const {
        data: { label, value, pararam },
    } = props;
    return (
        <components.Option {...props}>
            {/* @ts-ignore */}
            <ManagerView label={label} id={value as number} pararam={pararam} />
        </components.Option>
    );
};

export type TeamFormDataT = Override<
    NewTeamT,
    { manager: EmployeeSelectOptionT | null }
>;

type BaseTeamFormPropsT = {
    data: TeamFormDataT;
    onSave: (formData: NewTeamT) => void;
    onCloseClick: () => void;
    isLoading: boolean;
    saveButtonText: string;
};

export const BaseTeamForm: React.FC<BaseTeamFormPropsT> = ({
    data,
    onCloseClick,
    onSave,
    isLoading,
    saveButtonText,
}) => {
    const {
        handleSubmit,
        register,
        getValues,
        setValue,
        control,
        formState: { errors },
    } = useForm<TeamFormDataT>({
        defaultValues: data,
        mode: "onBlur",
    });

    const handleOnSubmit = (formData: TeamFormDataT) =>
        onSave(formData as NewTeamT);

    return (
        <ModalForm
            isLoading={isLoading}
            onSubmit={handleSubmit(handleOnSubmit)}
            onCancelClick={onCloseClick}
            saveButtonText={saveButtonText}
        >
            <FormTextField
                name="name"
                label="Name"
                rules={genRules({ required: true, minLength: 2 })}
                register={register}
                // @ts-ignore
                errors={errors}
            />

            <FormTextField
                name="key"
                label="Short name (tag) for search"
                register={register}
                // @ts-ignore
                errors={errors}
            />

            <Box width="600px" height="300px" overflow="hidden">
                <RichTextEditor
                    data={getValues("description")}
                    onChange={(value) => setValue("description", value)}
                />
            </Box>

            <FormReduxSelectField
                optionsLoadFn={employeesApi.useListEmployeeSelectQuery}
                rules={genRules({ required: true })}
                control={control}
                name="manager"
                // @ts-ignore
                components={{ Option: ManagerOption }}
                label="Team Lead"
            />

            <MultipleTagFormSelectField
                optionsLoadFn={catalogsApi.useListTeamTagSelectQuery}
                // @ts-ignore
                control={control}
                name="tags"
                label="Team tags"
            />

            <FormReduxSelectField
                optionsLoadFn={employeesApi.useListTeamSelectQuery}
                control={control}
                name="head_team"
                label="Head team"
                isClearable
            />
        </ModalForm>
    );
};

const addTeamInitialState: TeamFormDataT = {
    name: "",
    key: "",
    description: "",
    manager: null,
    tags: [],
    head_team: null,
};

type CreateTeamFormPropsT = {
    onClose: () => void;
};

export const CreateTeamForm: React.FC<CreateTeamFormPropsT> = ({ onClose }) => {
    const [createTeam, createTeamProps] = employeesApi.useCreateTeamMutation();

    const handleSave = (formData: NewTeamT) => {
        createTeam(formData)
            .unwrap()
            .then(() => {
                toast.success("Team created successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <BaseTeamForm
            data={addTeamInitialState}
            isLoading={createTeamProps.isLoading}
            onSave={handleSave}
            onCloseClick={onClose}
            saveButtonText="Create"
        />
    );
};

type EditTeamFormDataLoadedPropsT = {
    data: TeamT;
    onClose: () => void;
};

export const EditTeamFormDataLoaded: React.FC<EditTeamFormDataLoadedPropsT> = ({
    data,
    onClose,
}) => {
    const [updateTeam, updateTeamProps] = employeesApi.useUpdateTeamMutation();

    const handleSave = (formData: NewTeamT) => {
        const { id } = data;

        updateTeam({ id, ...formData })
            .unwrap()
            .then(() => {
                toast.success("Team updated successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <BaseTeamForm
            data={data}
            isLoading={updateTeamProps.isLoading}
            onSave={handleSave}
            onCloseClick={onClose}
            saveButtonText="Update"
        />
    );
};

type EditTeamFormPropsT = {
    onClose: () => void;
    id: number;
};

export const EditTeamForm: React.FC<EditTeamFormPropsT> = ({ onClose, id }) => {
    const { data, error, isLoading, isUninitialized, isError } =
        employeesApi.useGetTeamQuery({ id });

    if (isUninitialized || isLoading)
        return <CircularProgress color="success" />;

    if (isError)
        return (
            <Box>
                <p>{`Error: ${JSON.stringify(error)}`}</p>
            </Box>
        );

    return <EditTeamFormDataLoaded data={data.payload} onClose={onClose} />;
};
