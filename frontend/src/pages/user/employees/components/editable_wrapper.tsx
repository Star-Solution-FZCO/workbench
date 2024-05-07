/* eslint-disable @typescript-eslint/no-explicit-any */
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";
import SaveIcon from "@mui/icons-material/Save";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { EditButton, Modal } from "_components";
import { FormRow } from "_components/fields";
import { authActions, employeesApi } from "_redux";
import { loginPageUrl } from "config";
import { FC, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { UpdateEmployeeT } from "types";
import { checkFieldCanBeEdited, toastError } from "utils";
import { formatDateYYYYMMDD } from "utils/convert";

type UpdateEmployeeFieldT = keyof UpdateEmployeeT;

interface IEditableWrapperProps {
    label: string;
    value: any;
    name: string;
    metadata: any;
    editMode: boolean;
    onChangeEditMode: () => void;
    editModeChildren: React.ReactNode;
    previewChildren: React.ReactNode;
}

const EditableWrapper: FC<IEditableWrapperProps> = ({
    label,
    name,
    metadata,
    editMode,
    onChangeEditMode,
    editModeChildren,
    previewChildren,
}) => {
    const navigate = useNavigate();

    const [modalOpen, setModalOpen] = useState(false);

    const { handleSubmit } = useFormContext<UpdateEmployeeT>();

    const [updateEmployee] = employeesApi.useUpdateEmployeeMutation();

    const handleOnSubmit = (formData: UpdateEmployeeT) => {
        let newValue = formData[name as UpdateEmployeeFieldT];

        if (newValue instanceof Date) {
            newValue = formatDateYYYYMMDD(newValue);
        }

        updateEmployee({
            id: formData.id,
            [name]: newValue,
        })
            .unwrap()
            .then(() => {
                if (name === "timezone") {
                    setModalOpen(true);
                }
                toast.success(`"${label}" field updated`);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleLogout = () => {
        setModalOpen(false);
        authActions.logout();
        navigate(loginPageUrl);
    };

    const save = () => {
        onChangeEditMode();
        handleSubmit(handleOnSubmit)();
    };

    return (
        <FormRow label={label}>
            {name === "timezone" && (
                <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap={1}
                    >
                        <Typography fontWeight={500}>
                            To apply the timezone change, you need to relogin
                        </Typography>
                        <Box display="flex" gap={1}>
                            <Button
                                onClick={handleLogout}
                                startIcon={<LogoutIcon />}
                                variant="outlined"
                            >
                                Logout now
                            </Button>
                            <Button
                                onClick={() => setModalOpen(false)}
                                color="info"
                                variant="outlined"
                            >
                                Later
                            </Button>
                        </Box>
                    </Box>
                </Modal>
            )}

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

                    {checkFieldCanBeEdited(name, metadata) && (
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
