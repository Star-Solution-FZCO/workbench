import { Box, Button, FormControl, Typography } from "@mui/material";
import { FormTextField, ModalForm } from "_components";
import { catalogsApi } from "_redux";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { NewUsefulLinkT, UsefulLinkT } from "types/models";
import { genRules, toastError } from "utils";

type BaseUsefulLinkFormPropsT = {
    data: NewUsefulLinkT;
    onSave: (data: NewUsefulLinkT) => void;
    onCloseClick: () => void;
    isLoading: boolean;
    saveButtonText: string;
};

const BaseUsefulLinkForm: React.FC<BaseUsefulLinkFormPropsT> = ({
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
    } = useForm<NewUsefulLinkT>({
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
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    errors={errors}
                />
            </FormControl>
            <FormControl>
                <FormTextField
                    name="link"
                    label="Link"
                    register={register}
                    rules={genRules({ required: true })}
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    errors={errors}
                />
            </FormControl>
        </ModalForm>
    );
};

const addUsefulLinkInitialState: NewUsefulLinkT = {
    name: "",
    link: "",
    description: "",
};

type CreateUsefulLinkFormPropsT = {
    onClose?: () => void;
};

const CreateUsefulLinkForm: React.FC<CreateUsefulLinkFormPropsT> = ({
    onClose = () => {},
}) => {
    const [createUsefulLinkMutation, createUsefulLinkProps] =
        catalogsApi.useCreateUsefulLinkMutation();
    const handleSave = (data: NewUsefulLinkT) => {
        createUsefulLinkMutation(data)
            .unwrap()
            .then(() => {
                toast.success("UsefulLink created successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };
    return (
        <BaseUsefulLinkForm
            data={addUsefulLinkInitialState}
            isLoading={createUsefulLinkProps.isLoading}
            onCloseClick={onClose}
            saveButtonText={"Create"}
            onSave={handleSave}
        />
    );
};

type EditUsefulLinkFormPropsT = {
    data: UsefulLinkT;
    onClose?: () => void;
};

const EditUsefulLinkForm: React.FC<EditUsefulLinkFormPropsT> = ({
    data,
    onClose = () => {},
}) => {
    const [updateUsefulLinkMutation, updateUsefulLinkProps] =
        catalogsApi.useUpdateUsefulLinkMutation();

    const handleSave = (formData: NewUsefulLinkT) => {
        const { id } = data;
        updateUsefulLinkMutation({ ...formData, id })
            .unwrap()
            .then(() => {
                toast.success("UsefulLink updated successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <BaseUsefulLinkForm
            data={data}
            isLoading={updateUsefulLinkProps.isLoading}
            onSave={handleSave}
            onCloseClick={onClose}
            saveButtonText="Update"
        />
    );
};

type DeleteUsefulLinkFormPropsT = {
    data: UsefulLinkT;
    onClose?: () => void;
};

const DeleteUsefulLinkForm: React.FC<DeleteUsefulLinkFormPropsT> = ({
    data,
    onClose = () => {},
}) => {
    const [deleteUsefulLinkMutation] =
        catalogsApi.useDeleteUsefulLinkMutation();

    const handleDelete = () => {
        deleteUsefulLinkMutation(data.id)
            .unwrap()
            .then(() => {
                toast.success("UsefulLink deleted successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };
    return (
        <Box>
            <Box display="flex" justifyContent="center">
                <Typography>
                    Are you sure you want to delete "{data.name}" link ?
                </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mt={2}>
                <Button
                    onClick={onClose}
                    sx={{ width: "10rem", mr: 2 }}
                    color="error"
                    variant="contained"
                >
                    NO
                </Button>
                <Button
                    onClick={handleDelete}
                    sx={{ width: "10rem" }}
                    color="success"
                    variant="contained"
                >
                    YES
                </Button>
            </Box>
        </Box>
    );
};

export { CreateUsefulLinkForm, DeleteUsefulLinkForm, EditUsefulLinkForm };
