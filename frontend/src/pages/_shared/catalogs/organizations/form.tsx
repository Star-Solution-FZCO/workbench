import { Box, CircularProgress, FormControl } from "@mui/material";
import { FormTextField, ModalForm } from "_components";
import { catalogsApi } from "_redux";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { NewOrganizationT, OrganizationT } from "types/models";
import { genRules, toastError } from "utils";

type BaseOrganizationFormPropsT = {
    data: NewOrganizationT;
    onSave: (data: NewOrganizationT) => void;
    onCloseClick: () => void;
    isLoading: boolean;
    saveButtonText: string;
};

const BaseOrganizationForm: React.FC<BaseOrganizationFormPropsT> = ({
    data,
    onCloseClick,
    onSave,
    isLoading,
    saveButtonText,
}) => {
    const {
        handleSubmit,
        register,
        formState: { errors },
    } = useForm<NewOrganizationT>({
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
                    multiline
                    maxRows={4}
                    // @ts-ignore
                    errors={errors}
                />
            </FormControl>
        </ModalForm>
    );
};

const addOrganizationInitialState: NewOrganizationT = {
    name: "",
    description: "",
};

type CreateOrganizationFormPropsT = {
    onClose: () => void;
};

export const CreateOrganizationForm: React.FC<CreateOrganizationFormPropsT> = ({
    onClose,
}) => {
    const [createOrganizationMutation, createOrganizationProps] =
        catalogsApi.useCreateOrganizationMutation();

    const handleSave = (data: NewOrganizationT) => {
        createOrganizationMutation(data)
            .unwrap()
            .then(() => {
                toast.success("Organization created successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <BaseOrganizationForm
            data={addOrganizationInitialState}
            isLoading={createOrganizationProps.isLoading}
            onCloseClick={onClose}
            saveButtonText={"Create"}
            onSave={handleSave}
        />
    );
};

type EditOrganizationFormDataLoadedPropsT = {
    data: OrganizationT;
    onClose: () => void;
};

export const EditOrganizationFormDataLoaded: React.FC<
    EditOrganizationFormDataLoadedPropsT
> = ({ data, onClose }) => {
    const [updateOrganizationMutation, updateOrganizationProps] =
        catalogsApi.useUpdateOrganizationMutation();

    const handleSave = (formData: NewOrganizationT) => {
        const { id } = data;
        updateOrganizationMutation({ ...formData, id })
            .unwrap()
            .then(() => {
                toast.success("Organization created successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <BaseOrganizationForm
            data={data}
            isLoading={updateOrganizationProps.isLoading}
            onSave={handleSave}
            onCloseClick={onClose}
            saveButtonText="Update"
        />
    );
};

type OrganizationFormPropsT = {
    onClose: () => void;
    id: number;
};

export const EditOrganizationForm: React.FC<OrganizationFormPropsT> = ({
    onClose,
    id,
}) => {
    const { data, error, isLoading, isUninitialized, isError } =
        catalogsApi.useGetOrganizationQuery({ id });

    if (isUninitialized || isLoading)
        return <CircularProgress color="success" />;

    if (isError)
        return (
            <Box>
                <p>{`Error: ${JSON.stringify(error)}`}</p>
            </Box>
        );

    return (
        <EditOrganizationFormDataLoaded data={data.payload} onClose={onClose} />
    );
};
