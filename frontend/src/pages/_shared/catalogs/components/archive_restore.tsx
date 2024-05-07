import ArchiveIcon from "@mui/icons-material/Archive";
import RestoreIcon from "@mui/icons-material/Restore";
import {
    Box,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography,
} from "@mui/material";
import { ModalForm } from "_components";
import { useAppSelector } from "_redux";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { toastError } from "utils";

interface IArchiveRestoreButtonProps {
    row: any;
    onClick: (id: number) => void;
}

export const ArchiveRestoreButton: FC<IArchiveRestoreButtonProps> = ({
    row,
    onClick,
}) => {
    const roles = useAppSelector((state) => state.profile.payload.roles);

    return ["hr", "admin", "super_hr", "super_admin"].some((role) =>
        roles?.includes(role),
    ) ? (
        <Tooltip title={row.is_archived ? "Restore" : "Archive"}>
            <IconButton
                sx={{ p: 0 }}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(row.id);
                }}
            >
                {row.is_archived ? <RestoreIcon /> : <ArchiveIcon />}
            </IconButton>
        </Tooltip>
    ) : null;
};

interface IArchiveRestoreFormProps {
    id: number;
    entityName: string;
    getEntityQuery: any;
    useArchiveMutation: any;
    useRestoreMutation: any;
    onClose: () => void;
}

export const ArchiveRestoreForm: React.FC<IArchiveRestoreFormProps> = ({
    id,
    entityName,
    getEntityQuery,
    useArchiveMutation,
    useRestoreMutation,
    onClose,
}) => {
    const { data, error, isLoading, isUninitialized, isError } = getEntityQuery(
        { id },
    );

    const [archive] = useArchiveMutation();
    const [restore] = useRestoreMutation();

    const { handleSubmit } = useForm();

    const submit = () => {
        if (!data?.payload) return;

        let mutation = null;

        mutation = data.payload.is_archived ? restore : archive;

        if (mutation === null) return;

        mutation({ id })
            .unwrap()
            .then(() => {
                onClose();
                toast.success(
                    `${entityName} "${
                        data.payload.name
                    }" has been successfully ${
                        data.payload.is_archived ? "restored" : "archived"
                    }`,
                );
            })
            .catch((error: any) => {
                toastError(error);
            });
    };

    if (isUninitialized || isLoading)
        return <CircularProgress color="success" />;

    if (isError)
        return (
            <Box>
                <p>{`Error: ${JSON.stringify(error)}`}</p>
            </Box>
        );

    return (
        <ModalForm
            isLoading={isLoading}
            onSubmit={handleSubmit(submit)}
            onCancelClick={onClose}
            saveButtonText={data?.payload?.is_archived ? "Restore" : "Archive"}
            cancelButtonText="Cancel"
        >
            <Typography fontWeight={500} align="center">
                Are you sure you want to{" "}
                {data.payload.is_archived ? "restore" : "archive"} the "
                {data?.payload?.name}" {entityName.toLowerCase()}?
            </Typography>
        </ModalForm>
    );
};
