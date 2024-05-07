import { Box, Modal as MUIModal, ModalProps } from "@mui/material";
import React from "react";

type ModalProsT = React.PropsWithChildren & {
    className?: string;
    open?: boolean;
    fullHeight?: boolean;
    onClose: () => void;
    modalProps?: ModalProps;
};

export const Modal: React.FC<ModalProsT> = ({
    className,
    children,
    onClose,
    open = false,
    fullHeight = false,
    modalProps,
}) => {
    return (
        <MUIModal {...modalProps} open={open} onClose={onClose}>
            <Box
                className={className}
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    minWidth: 500,
                    maxHeight: "calc(100vh - 40px)",
                    bgcolor: "background.paper",
                    boxShadow: 24,
                    padding: "20px",
                    borderRadius: 1,
                    ...(fullHeight && { height: "100%" }),
                }}
            >
                {children}
            </Box>
        </MUIModal>
    );
};
export const RequestConfirmation: React.FC<
    ModalProsT & { renderModalContent: () => React.ReactNode }
> = ({ children, renderModalContent, ...props }) => {
    return (
        <>
            <Modal {...props}>{renderModalContent()}</Modal>
            {children}
        </>
    );
};
