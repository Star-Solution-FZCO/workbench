import { Box, useTheme } from "@mui/material";
import {
    ApproveButton,
    ClearButton,
    EditButton,
    FormTextField,
} from "_components";
import { employeesApi } from "_redux";
import { FC, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import { UpdateEmployeeT } from "types";
import { toastError } from "utils";

type UpdateEmployeeFieldT = keyof UpdateEmployeeT;

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
        useFormContext<UpdateEmployeeT>();

    const [editMode, setEditMode] = useState(false);
    const oldValue = getValues(name as UpdateEmployeeFieldT);

    const [updateEmployee] = employeesApi.useUpdateEmployeeMutation();

    const handleOnSubmit = (formData: UpdateEmployeeT) => {
        updateEmployee({
            id: formData.id,
            [name]: formData[name as UpdateEmployeeFieldT],
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
        setValue(name as keyof UpdateEmployeeT, oldValue);
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

export default EditableTextField;
