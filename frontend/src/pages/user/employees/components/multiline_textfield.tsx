import { LoadingButton } from "@mui/lab";
import { Box, Button, Typography } from "@mui/material";
import { EditButton, FormTextField, Modal } from "_components";
import { FormRow } from "_components/fields";
import { employeesApi } from "_redux";
import { FC, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import { UpdateEmployeeT } from "types";
import { checkFieldCanBeEdited, toastError } from "utils";

type UpdateEmployeeFieldT = keyof UpdateEmployeeT;

interface IMultilineTextfieldProps {
    label: string;
    name: string;
    value: string | null;
    metadata: any;
}

const MultilineTextfield: FC<IMultilineTextfieldProps> = ({
    label,
    name,
    value,
    metadata,
}) => {
    const [open, setOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    const { register, handleSubmit } = useFormContext<UpdateEmployeeT>();

    const [updateEmployee] = employeesApi.useUpdateEmployeeMutation();

    const handleOnSubmit = (formData: UpdateEmployeeT) => {
        setUpdating(true);

        updateEmployee({
            id: formData.id,
            [name]: formData[name as UpdateEmployeeFieldT],
        })
            .unwrap()
            .then(() => {
                setOpen(false);
                toast.success(`"${label}" field updated`);
            })
            .catch((error) => {
                toastError(error);
            })
            .finally(() => {
                setUpdating(false);
            });
    };

    const save = () => {
        handleSubmit(handleOnSubmit)();
    };

    return (
        <>
            <Modal open={open} onClose={() => setOpen(false)}>
                <Box display="flex" flexDirection="column" gap="16px">
                    <Typography fontWeight="medium">
                        Edit {label.toLowerCase()}
                    </Typography>
                    <FormTextField
                        label={label}
                        name={name}
                        register={register}
                        variant="outlined"
                        multiline
                        rows={5}
                    />
                    <Box display="flex" justifyContent="flex-end" gap="4px">
                        <LoadingButton
                            onClick={save}
                            variant="outlined"
                            loading={updating}
                        >
                            Save
                        </LoadingButton>
                        <Button
                            onClick={() => setOpen(false)}
                            variant="outlined"
                            color="error"
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <FormRow label={label}>
                <Box
                    display="flex"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    height="100%"
                    gap="4px"
                    borderBottom="1px solid #949494"
                >
                    <Box maxHeight="150px" overflow="auto" fontSize={14}>
                        {value}
                    </Box>

                    {checkFieldCanBeEdited(name, metadata) && (
                        <EditButton
                            tooltip="Edit"
                            onClick={() => setOpen(true)}
                        />
                    )}
                </Box>
            </FormRow>
        </>
    );
};

export default MultilineTextfield;
