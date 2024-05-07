import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { LoadingButton } from "@mui/lab";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { RichTextEditor } from "_components";
import { sharedApi, useAppSelector } from "_redux";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ChangelogT, NewChangelogT } from "types";
import { toastError } from "utils";
import { formatDateYYYYMMDD } from "utils/convert";

interface IChangelogFormProps {
    ininitalData?: ChangelogT;
    editMode?: boolean;
}

const ChangelogForm: FC<IChangelogFormProps> = ({ ininitalData, editMode }) => {
    const navigate = useNavigate();

    const isAdmin = useAppSelector((state) => state.profile.payload.admin);

    const [releaseDate, setReleaseDate] = useState<Date | null>(
        ininitalData?.release_date ? new Date(ininitalData.release_date) : null,
    );

    const [createChangelog, createChangelogProps] =
        sharedApi.useCreateChangelogMutation();
    const [updateChangelog, updateChangelogProps] =
        sharedApi.useUpdateChangelogMutation();
    const [deleteChangelog, deleteChangelogProps] =
        sharedApi.useDeleteChangelogMutation();

    const {
        register,
        getValues,
        setValue,
        watch,
        formState: { errors },
    } = useForm<NewChangelogT>({
        mode: "onBlur",
        defaultValues: {
            name: ininitalData?.name || "",
            content: ininitalData?.content || "",
        },
    });

    const save = () => {
        createChangelog({
            ...getValues(),
            release_date: releaseDate ? formatDateYYYYMMDD(releaseDate) : null,
        })
            .unwrap()
            .then(() => {
                navigate("/changelog");
                toast.success("Сhangelog was created successfully");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const update = () => {
        if (!ininitalData) return;

        updateChangelog({
            id: ininitalData?.id,
            ...getValues(),
            release_date: releaseDate ? formatDateYYYYMMDD(releaseDate) : null,
        })
            .unwrap()
            .then(() => {
                navigate("/changelog");
                toast.success("Сhangelog was updated successfully");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleClickDelete = () => {
        if (!ininitalData) return;

        const confirmed = confirm(
            `Are you sure you want to delete "${ininitalData.name}" changelog?`,
        );

        if (!confirmed) return;

        deleteChangelog(ininitalData?.id)
            .unwrap()
            .then(() => {
                navigate("/changelog");
                toast.success("Сhangelog was deleted successfully");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleClickSave = () => {
        if (editMode) {
            update();
        } else {
            save();
        }
    };

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box display="flex" alignItems="center" gap={1}>
                <IconButton onClick={() => navigate("..")}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography fontWeight={500}>
                    {editMode ? "Edit" : "Create"} changelog
                </Typography>
            </Box>

            <TextField
                {...register("name", {
                    required: "Required field",
                })}
                label="Name"
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
            />
            <DatePicker
                sx={{ alignSelf: "flex-start" }}
                label="Release date"
                value={releaseDate}
                onChange={(date) => setReleaseDate(date)}
                slotProps={{ actionBar: { actions: ["today", "clear"] } }}
            />

            <Box flex={1} overflow="hidden">
                <RichTextEditor
                    data={getValues("content")}
                    onChange={(value) => setValue("content", value)}
                    readOnly={!isAdmin}
                />
            </Box>

            {isAdmin && (
                <Box display="flex" gap={1}>
                    <LoadingButton
                        onClick={handleClickSave}
                        loading={
                            createChangelogProps.isLoading ||
                            updateChangelogProps.isLoading
                        }
                        disabled={!watch("content") || !!errors.name}
                        variant="outlined"
                        size="small"
                    >
                        Save
                    </LoadingButton>

                    {editMode && (
                        <LoadingButton
                            onClick={handleClickDelete}
                            loading={deleteChangelogProps.isLoading}
                            variant="outlined"
                            color="error"
                            size="small"
                        >
                            Delete
                        </LoadingButton>
                    )}
                </Box>
            )}
        </Box>
    );
};

export { ChangelogForm };
