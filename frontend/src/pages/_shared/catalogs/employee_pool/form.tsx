import { Box, CircularProgress, FormControl } from "@mui/material";
import { FormTextField, ModalForm } from "_components";
import { catalogsApi } from "_redux";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { EmployeePoolT, NewEmployeePoolT } from "types/models";
import { genRules, toastError } from "utils";

type BaseEmployeePoolFormPropsT = {
    data: NewEmployeePoolT;
    onSave: (data: NewEmployeePoolT) => void;
    onCloseClick: () => void;
    isLoading: boolean;
    saveButtonText: string;
};
const BaseEmployeePoolForm: React.FC<BaseEmployeePoolFormPropsT> = ({
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
    } = useForm<NewEmployeePoolT>({
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
        </ModalForm>
    );
};
const addEmployeePoolInitialState: NewEmployeePoolT = {
    name: "",
};
type CreateEmployeePoolFormPropsT = {
    onClose: () => void;
};
export const CreateEmployeePoolForm: React.FC<CreateEmployeePoolFormPropsT> = ({
    onClose,
}) => {
    const [createEmployeePoolMutation, createEmployeePoolProps] =
        catalogsApi.useCreateEmployeePoolMutation();
    const handleSave = (data: NewEmployeePoolT) => {
        createEmployeePoolMutation(data)
            .unwrap()
            .then(() => {
                toast.success("Pool created successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };
    return (
        <BaseEmployeePoolForm
            data={addEmployeePoolInitialState}
            isLoading={createEmployeePoolProps.isLoading}
            onCloseClick={onClose}
            saveButtonText={"Create"}
            onSave={handleSave}
        />
    );
};
type EditEmployeePoolFormDataLoadedPropsT = {
    data: EmployeePoolT;
    onClose: () => void;
};
export const EditEmployeePoolFormDataLoaded: React.FC<
    EditEmployeePoolFormDataLoadedPropsT
> = ({ data, onClose }) => {
    const [updateEmployeePoolMutation, updateEmployeePoolProps] =
        catalogsApi.useUpdateEmployeePoolMutation();
    const handleSave = (formData: NewEmployeePoolT) => {
        const { id } = data;
        updateEmployeePoolMutation({ ...formData, id })
            .unwrap()
            .then(() => {
                toast.success("Pool updated successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };
    return (
        <BaseEmployeePoolForm
            data={data}
            isLoading={updateEmployeePoolProps.isLoading}
            onSave={handleSave}
            onCloseClick={onClose}
            saveButtonText="Update"
        />
    );
};
type EditEmployeePoolFormPropsT = {
    onClose: () => void;
    id: number;
};
export const EditEmployeePoolForm: React.FC<EditEmployeePoolFormPropsT> = ({
    onClose,
    id,
}) => {
    const { data, error, isLoading, isUninitialized, isError } =
        catalogsApi.useGetEmployeePoolQuery(id);
    if (isUninitialized || isLoading)
        return <CircularProgress color="success" />;
    if (isError)
        return (
            <Box>
                <p>{`Error: ${JSON.stringify(error)}`}</p>
            </Box>
        );
    return (
        <EditEmployeePoolFormDataLoaded data={data.payload} onClose={onClose} />
    );
};
