import { Box, Button, Typography } from "@mui/material";
import { catalogsApi } from "_redux";
import React from "react";
import { toast } from "react-toastify";
import { APITokenT } from "types/models";
import { toastError } from "utils";

type RevokeAPITokenFormPropsT = {
    data: APITokenT;
    onClose?: () => void;
};

const RevokeAPITokenForm: React.FC<RevokeAPITokenFormPropsT> = ({
    data,
    onClose = () => {},
}) => {
    const [deleteAPITokenMutation] = catalogsApi.useDeleteAPITokenMutation();
    const handleDelete = () => {
        deleteAPITokenMutation(data.id)
            .unwrap()
            .then(() => {
                toast.success("Token revoked successfully");
                onClose();
            })
            .catch((error) => {
                toastError(error);
            });
    };
    return (
        <Box>
            <Box display="flex" justifyContent="center">
                <Typography>
                    Are you sure you want to revoke "{data.name}" token ?
                </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mt={2}>
                <Button
                    onClick={onClose}
                    sx={{ width: "10rem", mr: 2 }}
                    color="error"
                    variant="contained"
                >
                    NO
                </Button>
                <Button
                    onClick={handleDelete}
                    sx={{ width: "10rem" }}
                    color="success"
                    variant="contained"
                >
                    YES
                </Button>
            </Box>
        </Box>
    );
};

export { RevokeAPITokenForm };
