import { Box, Button, Modal, ModalProps, Typography } from "@mui/material";
import React from "react";

type ConfirmationDialogPropsT = {
    text: string;
    open: boolean;
    onReject: () => void;
    onConfirm: () => void;
    modalProps?: ModalProps;
};
export const ConfirmationDialog: React.FC<ConfirmationDialogPropsT> = ({
    open,
    text,
    modalProps,
    onReject,
    onConfirm,
}) => {
    return (
        <Modal {...modalProps} open={open} onClose={onReject}>
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    bgcolor: "background.paper",
                    p: 4,
                    borderRadius: 1,
                }}
            >
                <Box display="flex" justifyContent="center">
                    <Typography>{text} ?</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mt={2}>
                    <Button
                        onClick={onReject}
                        sx={{ width: "10rem", mr: 2 }}
                        color="error"
                        variant="contained"
                    >
                        NO
                    </Button>
                    <Button
                        onClick={onConfirm}
                        sx={{ width: "10rem" }}
                        color="success"
                        variant="contained"
                    >
                        YES
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};
