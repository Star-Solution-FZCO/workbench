import { Box, CircularProgress, FormControl } from "@mui/material";
import { FormReduxSelectField, FormTextField, ModalForm } from "_components";
import { catalogsApi } from "_redux";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { NewPositionT, PositionT } from "types/models";
import { genRules, toastError } from "utils";

type BasePositionFormPropsT = {
    data: NewPositionT;
    onSave: (data: NewPositionT) => void;
    onCloseClick: () => void;
    isLoading: boolean;
    saveButtonText: string;
};
const BasePositionForm: React.FC<BasePositionFormPropsT> = ({
    data,
    onCloseClick,
    onSave,
    isLoading,
    saveButtonText,
}) => {
    const {
        handleSubmit,
        register,
        control,
        formState: { errors },
    } = useForm<NewPositionT>({
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
            <FormControl>
                <FormReduxSelectField
                    name="category"
                    label="Category"
                    control={control}
                    rules={{ required: true }}
                    optionsLoadFn={
                        catalogsApi.useListPositionCategorySelectQuery
                    }
                />
            </FormControl>
        </ModalForm>
    );
};
const addPositionInitialState: NewPositionT = {
    name: "",
    description: "",
    category: null,
};
type CreatePositionFormPropsT = {
    onClose: () => void;
};
export const CreatePositionForm: React.FC<CreatePositionFormPropsT> = ({
    onClose,
}) => {
    const [createPositionMutation, createPositionProps] =
        catalogsApi.useCreatePositionMutation();
    const handleSave = (data: NewPositionT) => {
        createPositionMutation(data)
            .unwrap()
            .then(() => {
                toast.success("Position created successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };
    return (
        <BasePositionForm
            data={addPositionInitialState}
            isLoading={createPositionProps.isLoading}
            onCloseClick={onClose}
            saveButtonText={"Create"}
            onSave={handleSave}
        />
    );
};
type EditPositionFormDataLoadedPropsT = {
    data: PositionT;
    onClose: () => void;
};
export const EditPositionFormDataLoaded: React.FC<
    EditPositionFormDataLoadedPropsT
> = ({ data, onClose }) => {
    const [updatePositionMutation, updatePositionProps] =
        catalogsApi.useUpdatePositionMutation();
    const handleSave = (formData: NewPositionT) => {
        const { id } = data;
        updatePositionMutation({ ...formData, id })
            .unwrap()
            .then(() => {
                toast.success("Position created successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };
    return (
        <BasePositionForm
            data={data}
            isLoading={updatePositionProps.isLoading}
            onSave={handleSave}
            onCloseClick={onClose}
            saveButtonText="Update"
        />
    );
};
type EditPositionFormPropsT = {
    onClose: () => void;
    id: number;
};
export const EditPositionForm: React.FC<EditPositionFormPropsT> = ({
    onClose,
    id,
}) => {
    const { data, error, isLoading, isUninitialized, isError } =
        catalogsApi.useGetPositionQuery({ id });
    if (isUninitialized || isLoading)
        return <CircularProgress color="success" />;
    if (isError)
        return (
            <Box>
                <p>{`Error: ${JSON.stringify(error)}`}</p>
            </Box>
        );
    return <EditPositionFormDataLoaded data={data.payload} onClose={onClose} />;
};
