import { Box, CircularProgress, FormControl } from "@mui/material";
import { FormTextField, ModalForm } from "_components";
import { catalogsApi } from "_redux";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { HolidaySetT, NewHolidaySetT } from "types/models";
import { genRules, toastError } from "utils";

type BaseHolidaySetFormPropsT = {
    data: NewHolidaySetT;
    onSave: (data: NewHolidaySetT) => void;
    onCloseClick: () => void;
    isLoading: boolean;
    saveButtonText: string;
};

const BaseHolidatSetForm: React.FC<BaseHolidaySetFormPropsT> = ({
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
    } = useForm<NewHolidaySetT>({
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

const addHolidaySetInitialState: NewHolidaySetT = {
    name: "",
    description: "",
};

type CreateHolidaySetFormPropsT = {
    onClose: () => void;
};

export const CreateHolidaySetForm: React.FC<CreateHolidaySetFormPropsT> = ({
    onClose,
}) => {
    const [createHolidaySet, createHolidaySetProps] =
        catalogsApi.useCreateHolidaySetMutation();

    const handleSave = (data: NewHolidaySetT) => {
        createHolidaySet(data)
            .unwrap()
            .then(() => {
                toast.success("Holiday set has been successfully created");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <BaseHolidatSetForm
            data={addHolidaySetInitialState}
            isLoading={createHolidaySetProps.isLoading}
            onCloseClick={onClose}
            saveButtonText={"Create"}
            onSave={handleSave}
        />
    );
};

type EditHolidaySetFormPropsT = {
    data: HolidaySetT;
    onClose: () => void;
};

export const EditHolidaySetForm: React.FC<EditHolidaySetFormPropsT> = ({
    data,
    onClose,
}) => {
    const [updateHolidaySet, updateHolidaySetProps] =
        catalogsApi.useUpdateHolidaySetMutation();

    const handleSave = (formData: NewHolidaySetT) => {
        const { id } = data;

        updateHolidaySet({
            id,
            name: formData.name,
            description: formData.description,
        })
            .unwrap()
            .then(() => {
                toast.success("Holiday set has been successfully updated");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <BaseHolidatSetForm
            data={data}
            isLoading={updateHolidaySetProps.isLoading}
            onSave={handleSave}
            onCloseClick={onClose}
            saveButtonText="Update"
        />
    );
};

type EditHolidaySetFormWrapperProps = {
    onClose: () => void;
    id: number;
};

export const EditHolidaySetFormWrapper: React.FC<
    EditHolidaySetFormWrapperProps
> = ({ onClose, id }) => {
    const { data, error, isLoading, isUninitialized, isError } =
        catalogsApi.useGetHolidaySetQuery({ id });

    if (isUninitialized || isLoading)
        return <CircularProgress color="success" />;

    if (isError)
        return (
            <Box>
                <p>{`Error: ${JSON.stringify(error)}`}</p>
            </Box>
        );

    return <EditHolidaySetForm data={data.payload} onClose={onClose} />;
};
