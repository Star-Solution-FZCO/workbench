import CloseIcon from "@mui/icons-material/Close";
import {
    Box,
    Button,
    IconButton,
    Modal,
    TextField,
    Typography,
} from "@mui/material";
import { FC, useRef } from "react";
import { toast } from "react-toastify";

interface IClipboardProps {
    open: boolean;
    value: string;
    onClose: () => void;
}

const Clipboard: FC<IClipboardProps> = ({ open, value, onClose }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value);
        inputRef.current?.select();
        toast.success("Copied to clipboard");
    };

    return (
        <Modal
            open={open}
            onClose={(_, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") {
                    return;
                }
                onClose();
            }}
        >
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 600,
                    transform: "translate(-50%, -50%)",
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    p: 2,
                }}
            >
                <Box display="flex" flexDirection="column" gap={1}>
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography fontWeight={500}>
                            Copy to clipboard
                        </Typography>

                        <IconButton onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <TextField
                        label="Click to copy"
                        inputRef={inputRef}
                        value={value}
                        onClick={handleCopy}
                        InputProps={{
                            readOnly: true,
                        }}
                        fullWidth
                    />

                    <Button
                        onClick={handleCopy}
                        variant="outlined"
                        size="small"
                    >
                        Copy
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export { Clipboard };
