import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";
import { LoadingButton } from "@mui/lab";
import { Box } from "@mui/material";
import React from "react";

type ModalFormPropsT = {
    children: React.ReactNode;
    saveButtonText?: string;
    cancelButtonText?: string;
    isLoading: boolean;
    onSubmit: (data: any) => void;
    onCancelClick: () => void;
};

export const ModalForm: React.FC<ModalFormPropsT> = ({
    children,
    isLoading,
    onCancelClick,
    onSubmit,
    cancelButtonText = "Cancel",
    saveButtonText = "Save",
}) => {
    return (
        <form onSubmit={onSubmit}>
            <Box display="flex" flexDirection="column" gap={1}>
                {children}

                <Box display="flex" justifyContent="center" gap={1}>
                    <LoadingButton
                        loading={isLoading}
                        startIcon={<SaveIcon fontSize="small" />}
                        color="success"
                        variant="outlined"
                        type="submit"
                    >
                        {saveButtonText}
                    </LoadingButton>

                    <LoadingButton
                        loading={isLoading}
                        startIcon={<CancelIcon fontSize="small" />}
                        color="error"
                        variant="outlined"
                        onClick={onCancelClick}
                    >
                        {cancelButtonText}
                    </LoadingButton>
                </Box>
            </Box>
        </form>
    );
};
