import { Box, Button, Chip, TextField, Typography } from "@mui/material";
import { EditButton, Modal } from "_components";
import { FormRow } from "_components/fields";
import { employeesApi } from "_redux";
import { FC, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import { UpdateEmployeeT } from "types";
import { checkFieldCanBeEdited, toastError } from "utils";

interface IWorkChatListFieldProps {
    value: number[];
    label: string;
    name: string;
    metadata: any;
}

const WorkChatListField: FC<IWorkChatListFieldProps> = ({
    value: initialChats,
    label,
    name,
    metadata,
}) => {
    const [chats, setChats] = useState(initialChats);
    const [inputValue, setInputValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [openEditModal, setOpenEditModal] = useState(false);

    const { setValue, handleSubmit } = useFormContext<UpdateEmployeeT>();

    const [updateEmployee] = employeesApi.useUpdateEmployeeMutation();

    const handleDeleteChat = (targetChat: number) => {
        const confirmed = confirm("Are you sure you want to delete this chat?");
        if (!confirmed) return;
        setChats(chats.filter((chat) => chat !== targetChat));
    };

    const handleAddChat = () => {
        if (inputValue.length === 0) return;
        if (isNaN(+inputValue)) {
            setError("The value must be a number");
            return;
        }
        if (chats.includes(+inputValue)) {
            setError("This chat ID is already in the list");
            return;
        }
        error && setError(null);
        setChats([...chats, +inputValue]);
        setInputValue("");
    };

    const handleOnSubmit = (formData: UpdateEmployeeT) => {
        const newValue = formData[name as keyof UpdateEmployeeT];

        updateEmployee({
            id: formData.id,
            [name]: newValue,
        })
            .unwrap()
            .then(() => {
                toast.success(`"${label}" field updated`);
            })
            .catch((error) => {
                toastError(error);
            })
            .finally(() => {
                setOpenEditModal(false);
            });
    };

    const save = () => {
        setValue(name as keyof UpdateEmployeeT, chats);
        handleSubmit(handleOnSubmit)();
    };

    return (
        <FormRow label={label}>
            <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
                <Box display="flex" flexDirection="column" gap={1}>
                    <Typography>
                        To add a chat, enter the chat ID in the text field and
                        press "Add" button
                    </Typography>

                    <Box display="flex" alignItems="flex-start" gap={1}>
                        <TextField
                            value={inputValue}
                            onChange={(e) => {
                                error && setError(null);
                                setInputValue(e.target.value);
                            }}
                            error={!!error}
                            helperText={error}
                            type="number"
                            size="small"
                            fullWidth
                        />

                        <Button
                            onClick={handleAddChat}
                            variant="outlined"
                            size="small"
                            disabled={inputValue.length === 0}
                        >
                            Add
                        </Button>
                    </Box>

                    <Typography>Chats</Typography>

                    <Box display="flex" gap={1} flexWrap="wrap">
                        {chats.map((chat) => (
                            <Chip
                                key={chat}
                                label={chat}
                                onDelete={() => handleDeleteChat(chat)}
                            />
                        ))}
                    </Box>

                    <Box display="flex" gap={1}>
                        <Button onClick={save} variant="outlined" size="small">
                            Save
                        </Button>
                        <Button
                            onClick={() => setOpenEditModal(false)}
                            variant="outlined"
                            color="error"
                            size="small"
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
            >
                <Box display="flex" flexWrap="wrap" gap="4px">
                    {initialChats.map((el) => (
                        <Chip
                            key={el}
                            label={el.toString()}
                            variant="outlined"
                        />
                    ))}
                </Box>

                {checkFieldCanBeEdited(name, metadata) && (
                    <EditButton
                        tooltip="Edit"
                        onClick={() => setOpenEditModal(true)}
                    />
                )}
            </Box>
        </FormRow>
    );
};

export default WorkChatListField;
