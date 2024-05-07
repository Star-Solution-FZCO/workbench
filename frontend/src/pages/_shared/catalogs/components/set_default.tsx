import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { IconButton, Tooltip, Typography } from "@mui/material";
import { ModalForm } from "_components";
import { useAppSelector } from "_redux";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { toastError } from "utils";

interface ISetDefaultButtonProps {
    row: any;
    onClick: (id: number) => void;
}

export const SetDefaultButton: FC<ISetDefaultButtonProps> = ({
    row,
    onClick,
}) => {
    const roles = useAppSelector((state) => state.profile.payload.roles);

    return ["super_hr"].some((role) => roles?.includes(role)) ? (
        <Tooltip title={row.is_default ? "Default" : "Set as default"}>
            {row.is_default ? (
                <StarIcon color={"success"} />
            ) : (
                <IconButton
                    sx={{ p: 0 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick(row.id);
                    }}
                >
                    <StarBorderIcon />
                </IconButton>
            )}
        </Tooltip>
    ) : null;
};

interface ISetDefaultFormProps {
    id: number;
    entityName: string;
    useSetDefaultMutation: any;
    onClose: () => void;
}

export const SetDefaultForm: React.FC<ISetDefaultFormProps> = ({
    id,
    entityName,
    useSetDefaultMutation,
    onClose,
}) => {
    const [setDefault] = useSetDefaultMutation();

    const { handleSubmit } = useForm();

    const submit = () => {
        setDefault(id)
            .unwrap()
            .then(() => {
                onClose();
                toast.success(
                    `${entityName} "${id}" has been successfully set as default`,
                );
            })
            .catch((error: any) => {
                toastError(error);
            });
    };

    return (
        <ModalForm
            isLoading={false}
            onSubmit={handleSubmit(submit)}
            onCancelClick={onClose}
            saveButtonText="Set as default"
            cancelButtonText="Cancel"
        >
            <Typography fontWeight={500} align="center">
                Are you sure you want to change default{" "}
                {entityName.toLowerCase()}?
            </Typography>
        </ModalForm>
    );
};
