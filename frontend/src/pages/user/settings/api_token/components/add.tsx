import { FormControl } from "@mui/material";
import { Clipboard, FormTextField, ModalForm } from "_components";
import { catalogsApi } from "_redux";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { NewAPITokenT } from "types/models";
import { genRules, toastError } from "utils";

type CreateAPITokenFormPropsT = {
    onClose?: () => void;
};

const CreateAPITokenForm: React.FC<CreateAPITokenFormPropsT> = ({
    onClose = () => {},
}) => {
    const [receivedToken, setReceivedToken] = useState<string | null>(null);

    const [createAPITokenMutation, createAPITokenProps] =
        catalogsApi.useCreateAPITokenMutation();

    const handleSave = (data: NewAPITokenT) => {
        createAPITokenMutation(data)
            .unwrap()
            .then((response) => {
                setReceivedToken(response.payload.token);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const {
        handleSubmit,
        register,
        formState: { errors },
    } = useForm<NewAPITokenT>({
        defaultValues: {
            name: "",
            expires_in: null,
        },
        mode: "onBlur",
    });

    return receivedToken ? (
        <Clipboard open value={receivedToken} onClose={onClose} />
    ) : (
        <ModalForm
            isLoading={createAPITokenProps.isLoading}
            onSubmit={handleSubmit(handleSave)}
            onCancelClick={onClose}
            saveButtonText="Add"
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

export { CreateAPITokenForm };
