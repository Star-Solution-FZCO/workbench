import { Box, Typography, useTheme } from "@mui/material";
import {
    ApproveButton,
    ClearButton,
    EditButton,
    FormTextField,
} from "_components";
import { FormRow } from "_components/fields";
import { employeesApi } from "_redux";
import { FC, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import { UpdateCounteragentT } from "types";
import { toastError } from "utils";
import { UpdateCounteragentFieldT } from "./utils";

interface IEditableTextFieldProps {
    label: string;
    name: string;
    helperText?: string;
}

const EditableTextField: FC<IEditableTextFieldProps> = ({
    label,
    name,
    helperText,
}) => {
    const theme = useTheme();

    const { register, getValues, setValue, handleSubmit } =
        useFormContext<UpdateCounteragentT>();

    const [editMode, setEditMode] = useState(false);
    const oldValue = getValues(name as UpdateCounteragentFieldT);

    const [update] = employeesApi.useUpdateCounteragentMutation();

    const handleOnSubmit = (formData: UpdateCounteragentT) => {
        update({
            id: formData.id,
            [name]: formData[name as UpdateCounteragentFieldT],
        })
            .unwrap()
            .then(() => {
                toast.success(`"${label}" field updated`);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const save = () => {
        setEditMode(false);
        handleSubmit(handleOnSubmit)();
    };

    const cancel = () => {
        setValue(name as keyof UpdateCounteragentT, oldValue);
        setEditMode(false);
    };

    return (
        <FormTextField
            register={register}
            name={name}
            variant="standard"
            InputProps={{
                endAdornment: (
                    <Box display="flex">
                        {!editMode ? (
                            <EditButton
                                tooltip="Edit"
                                onClick={() => setEditMode(true)}
                            />
                        ) : (
                            <>
                                <ApproveButton tooltip="Save" onClick={save} />
                                <ClearButton
                                    tooltip="Cancel"
                                    onClick={cancel}
                                />
                            </>
                        )}
                    </Box>
                ),
            }}
            sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: theme.palette.text.primary,
                },
            }}
            disabled={!editMode}
            helperText={editMode && helperText}
            fullWidth
        />
    );
};

interface IFieldWrapperProps {
    label: string;
    name: string;
    value?: string | null;
    helperText?: string;
    editable?: boolean;
}

const FormFieldWrapper: FC<IFieldWrapperProps> = ({
    label,
    value,
    name,
    helperText,
    editable,
}) => (
    <FormRow label={label}>
        {editable ? (
            <EditableTextField
                label={label}
                name={name}
                helperText={helperText}
            />
        ) : (
            <Typography>{value || "---"}</Typography>
        )}
    </FormRow>
);

export default FormFieldWrapper;
