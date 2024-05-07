import { Box, CircularProgress, FormControl } from "@mui/material";
import { FormTextField, ModalForm } from "_components";
import { catalogsApi } from "_redux";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { CooperationTypeT, NewCooperationTypeT } from "types/models";
import { genRules, toastError } from "utils";

type BaseCooperationTypeFormPropsT = {
    data: NewCooperationTypeT;
    onSave: (data: NewCooperationTypeT) => void;
    onCloseClick: () => void;
    isLoading: boolean;
    saveButtonText: string;
};

const BaseCooperationTypeForm: React.FC<BaseCooperationTypeFormPropsT> = ({
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
    } = useForm<NewCooperationTypeT>({
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

const addCooperationTypeInitialState: NewCooperationTypeT = {
    name: "",
    description: "",
};

type CreateCooperationTypeFormPropsT = {
    onClose: () => void;
};

export const CreateCooperationTypeForm: React.FC<
    CreateCooperationTypeFormPropsT
> = ({ onClose }) => {
    const [createCooperationTypeMutation, createCooperationTypeProps] =
        catalogsApi.useCreateCooperationTypeMutation();

    const handleSave = (data: NewCooperationTypeT) => {
        createCooperationTypeMutation(data)
            .unwrap()
            .then(() => {
                toast.success("Cooperationt type created successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <BaseCooperationTypeForm
            data={addCooperationTypeInitialState}
            isLoading={createCooperationTypeProps.isLoading}
            onCloseClick={onClose}
            saveButtonText={"Create"}
            onSave={handleSave}
        />
    );
};

type EditCooperationTypeFormDataLoadedPropsT = {
    data: CooperationTypeT;
    onClose: () => void;
};

export const EditCooperationTypeFormDataLoaded: React.FC<
    EditCooperationTypeFormDataLoadedPropsT
> = ({ data, onClose }) => {
    const [updateCooperationTypeMutation, updateCooperationTypeProps] =
        catalogsApi.useUpdateCooperationTypeMutation();

    const handleSave = (formData: NewCooperationTypeT) => {
        const { id } = data;
        updateCooperationTypeMutation({ ...formData, id })
            .unwrap()
            .then(() => {
                toast.success("Cooperation type updated successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <BaseCooperationTypeForm
            data={data}
            isLoading={updateCooperationTypeProps.isLoading}
            onSave={handleSave}
            onCloseClick={onClose}
            saveButtonText="Update"
        />
    );
};

type CooperationTypeFormPropsT = {
    onClose: () => void;
    id: number;
};

export const EditCooperationTypeForm: React.FC<CooperationTypeFormPropsT> = ({
    onClose,
    id,
}) => {
    const { data, error, isLoading, isUninitialized, isError } =
        catalogsApi.useGetCooperationTypeQuery({ id });

    if (isUninitialized || isLoading)
        return <CircularProgress color="success" />;

    if (isError)
        return (
            <Box>
                <p>{`Error: ${JSON.stringify(error)}`}</p>
            </Box>
        );

    return (
        <EditCooperationTypeFormDataLoaded
            data={data.payload}
            onClose={onClose}
        />
    );
};
