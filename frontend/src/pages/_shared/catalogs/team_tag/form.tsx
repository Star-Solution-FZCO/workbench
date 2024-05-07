import { Box, CircularProgress, FormControl, TextField } from "@mui/material";
import { FormTextField, ModalForm } from "_components";
import { catalogsApi } from "_redux";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { NewTeamTagT, TeamTagT } from "types/models";
import { genRules, toastError } from "utils";

type BaseTeamTagFormPropsT = {
    data: NewTeamTagT;
    onSave: (data: NewTeamTagT) => void;
    onCloseClick: () => void;
    isLoading: boolean;
    saveButtonText: string;
};

const BaseTeamTagForm: React.FC<BaseTeamTagFormPropsT> = ({
    data,
    onCloseClick,
    onSave,
    isLoading,
    saveButtonText,
}) => {
    const {
        control,
        handleSubmit,
        register,
        formState: { errors },
    } = useForm<NewTeamTagT>({
        defaultValues: data,
        mode: "onBlur",
    });

    return (
        <ModalForm
            isLoading={isLoading}
            onSubmit={handleSubmit(onSave)}
            onCancelClick={onCloseClick}
            saveButtonText={saveButtonText}
            cancelButtonText="Cancel"
        >
            <FormControl>
                <FormTextField
                    name="name"
                    label="Name"
                    register={register}
                    rules={genRules({ required: true })}
                    // @ts-ignore
                    errors={errors}
                />
            </FormControl>
            <FormControl>
                <FormTextField
                    name="description"
                    label="Description"
                    register={register}
                    rules={genRules({ required: true })}
                    // @ts-ignore
                    errors={errors}
                    multiline
                    rows={4}
                />
            </FormControl>
            <FormControl>
                <Controller
                    name="color"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <Box display="flex" gap={1}>
                            <TextField
                                sx={{ flex: 1 }}
                                value={value}
                                onChange={onChange}
                                InputProps={{
                                    type: "color",
                                }}
                            />

                            <TextField
                                value={value}
                                onChange={onChange}
                                sx={{ flex: 8 }}
                                label="Color"
                                InputLabelProps={{ shrink: !!value }}
                            />
                        </Box>
                    )}
                />
            </FormControl>
        </ModalForm>
    );
};

const addTeamTagInitialState: NewTeamTagT = {
    name: "",
    description: "",
    color: null,
};

type CreateTeamTagFormPropsT = {
    onClose: () => void;
};

export const CreateTeamTagForm: React.FC<CreateTeamTagFormPropsT> = ({
    onClose,
}) => {
    const [createTeamTagMutation, createTeamTagProps] =
        catalogsApi.useCreateTeamTagMutation();

    const handleSave = (data: NewTeamTagT) => {
        createTeamTagMutation(data)
            .unwrap()
            .then(() => {
                toast.success("Team tag created successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <BaseTeamTagForm
            data={addTeamTagInitialState}
            isLoading={createTeamTagProps.isLoading}
            onCloseClick={onClose}
            saveButtonText={"Create"}
            onSave={handleSave}
        />
    );
};

type EditTeamTagFormDataLoadedPropsT = {
    data: TeamTagT;
    onClose: () => void;
};

export const EditTeamTagFormDataLoaded: React.FC<
    EditTeamTagFormDataLoadedPropsT
> = ({ data, onClose }) => {
    const [updateTeamTagMutation, updateTeamTagProps] =
        catalogsApi.useUpdateTeamTagMutation();

    const handleSave = (formData: NewTeamTagT) => {
        const { id } = data;

        updateTeamTagMutation({ ...formData, id })
            .unwrap()
            .then(() => {
                toast.success("Team tag updated successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <BaseTeamTagForm
            data={data}
            isLoading={updateTeamTagProps.isLoading}
            onSave={handleSave}
            onCloseClick={onClose}
            saveButtonText="Update"
        />
    );
};

type EditTeamTagFormPropsT = {
    onClose: () => void;
    id: number;
};

export const EditTeamTagForm: React.FC<EditTeamTagFormPropsT> = ({
    onClose,
    id,
}) => {
    const { data, error, isLoading, isUninitialized, isError } =
        catalogsApi.useGetTeamTagQuery({ id });

    if (isUninitialized || isLoading)
        return <CircularProgress color="success" />;

    if (isError)
        return (
            <Box>
                <p>{`Error: ${JSON.stringify(error)}`}</p>
            </Box>
        );

    return <EditTeamTagFormDataLoaded data={data.payload} onClose={onClose} />;
};
