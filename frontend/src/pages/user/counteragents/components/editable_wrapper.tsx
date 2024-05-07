/* eslint-disable @typescript-eslint/no-explicit-any */
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { Box, Button, Tooltip } from "@mui/material";
import { EditButton } from "_components";
import { FormRow } from "_components/fields";
import { employeesApi } from "_redux";
import { FC } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import { UpdateCounteragentT } from "types";

import { toastError } from "utils";
import { formatDateYYYYMMDD } from "utils/convert";
import { UpdateCounteragentFieldT } from "./utils";

interface IEditableWrapperProps {
    label: string;
    value: any;
    name: string;
    editable?: boolean;
    editMode: boolean;
    onChangeEditMode: () => void;
    editModeChildren: React.ReactNode;
    previewChildren: React.ReactNode;
}

const EditableWrapper: FC<IEditableWrapperProps> = ({
    label,
    name,
    editable,
    editMode,
    onChangeEditMode,
    editModeChildren,
    previewChildren,
}) => {
    const { handleSubmit } = useFormContext<UpdateCounteragentT>();

    const [update] = employeesApi.useUpdateCounteragentMutation();

    const handleOnSubmit = (formData: UpdateCounteragentT) => {
        let newValue = formData[name as UpdateCounteragentFieldT];

        if (newValue instanceof Date) {
            newValue = formatDateYYYYMMDD(newValue);
        }

        update({
            id: formData.id,
            [name]: newValue,
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
        onChangeEditMode();
        handleSubmit(handleOnSubmit)();
    };

    return (
        <FormRow label={label}>
            {editMode ? (
                <Box display="flex" gap={1}>
                    <Box flex={1}>{editModeChildren}</Box>

                    <Box
                        display="flex"
                        justifyContent="flex-end"
                        alignItems="flex-start"
                        gap={1}
                    >
                        <Tooltip title="Save" placement="top">
                            <Button
                                sx={{
                                    width: "40px",
                                    height: "40px",
                                    minWidth: 0,
                                    p: 0,
                                }}
                                variant="outlined"
                                onClick={save}
                            >
                                <SaveIcon />
                            </Button>
                        </Tooltip>

                        <Tooltip title="Cancel" placement="top">
                            <Button
                                sx={{
                                    width: "40px",
                                    height: "40px",
                                    minWidth: 0,
                                    p: 0,
                                }}
                                variant="outlined"
                                color="error"
                                onClick={() => onChangeEditMode()}
                            >
                                <CloseIcon />
                            </Button>
                        </Tooltip>
                    </Box>
                </Box>
            ) : (
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                >
                    {previewChildren}

                    {editable && (
                        <EditButton
                            tooltip="Edit"
                            onClick={() => onChangeEditMode()}
                        />
                    )}
                </Box>
            )}
        </FormRow>
    );
};

export default EditableWrapper;
