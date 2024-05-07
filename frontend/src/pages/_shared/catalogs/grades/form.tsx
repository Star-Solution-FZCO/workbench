import { Box, CircularProgress, FormControl } from "@mui/material";
import { FormTextField, ModalForm } from "_components";
import { catalogsApi } from "_redux";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { GradeT, NewGradeT } from "types/models";
import { genRules, toastError } from "utils";

type BaseGradeFormPropsT = {
    data: NewGradeT;
    onSave: (data: NewGradeT) => void;
    onCloseClick: () => void;
    isLoading: boolean;
    saveButtonText: string;
    is_create?: boolean;
};

const BaseGradeForm: React.FC<BaseGradeFormPropsT> = ({
    data,
    onCloseClick,
    onSave,
    isLoading,
    saveButtonText,
    is_create = false,
}) => {
    const {
        handleSubmit,
        register,
        formState: { errors },
    } = useForm<NewGradeT>({
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
                    disabled={!is_create}
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

const addGradeInitialState: NewGradeT = {
    name: "",
    description: "",
};

type CreateGradeFormPropsT = {
    onClose: () => void;
};

export const CreateGradeForm: React.FC<CreateGradeFormPropsT> = ({
    onClose,
}) => {
    const [createGradeMutation, createGradeProps] =
        catalogsApi.useCreateGradeMutation();
    const handleSave = (data: NewGradeT) => {
        createGradeMutation(data)
            .unwrap()
            .then(() => {
                toast.success("Grade created successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };
    return (
        <BaseGradeForm
            data={addGradeInitialState}
            isLoading={createGradeProps.isLoading}
            onCloseClick={onClose}
            saveButtonText={"Create"}
            onSave={handleSave}
            is_create
        />
    );
};

type EditOrganizationFormDataLoadedPropsT = {
    data: GradeT;
    onClose: () => void;
};

export const EditGradeFormDataLoaded: React.FC<
    EditOrganizationFormDataLoadedPropsT
> = ({ data, onClose }) => {
    const [updateGradeMutation, updateGradeProps] =
        catalogsApi.useUpdateGradeMutation();
    const handleSave = (formData: NewGradeT) => {
        const { id } = data;
        updateGradeMutation({ id, description: formData.description })
            .unwrap()
            .then(() => {
                toast.success("Grade created successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };
    return (
        <BaseGradeForm
            data={data}
            isLoading={updateGradeProps.isLoading}
            onSave={handleSave}
            onCloseClick={onClose}
            saveButtonText="Update"
        />
    );
};

type EditGradeFormPropsT = {
    onClose: () => void;
    id: number;
};

export const EditGradeForm: React.FC<EditGradeFormPropsT> = ({
    onClose,
    id,
}) => {
    const { data, error, isLoading, isUninitialized, isError } =
        catalogsApi.useGetGradeQuery({ id });
    if (isUninitialized || isLoading)
        return <CircularProgress color="success" />;
    if (isError)
        return (
            <Box>
                <p>{`Error: ${JSON.stringify(error)}`}</p>
            </Box>
        );
    return <EditGradeFormDataLoaded data={data.payload} onClose={onClose} />;
};
