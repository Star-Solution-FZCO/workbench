import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Typography,
} from "@mui/material";
import { Modal } from "_components";
import { employeesApi, sharedApi } from "_redux";
import { FC, useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { toastError } from "utils";

interface IUploadFileProps {
    onChange: (file: File | null) => void;
}

const UploadFile: FC<IUploadFileProps> = ({ onChange }) => {
    const [filename, setFilename] = useState<string | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;

            onChange(acceptedFiles[0]);
            setFilename(acceptedFiles[0].name);
        },
        [onChange],
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        multiple: false,
    });

    return (
        <Box {...getRootProps()}>
            <input {...getInputProps()} />

            {!filename ? (
                <Box display="flex" flexDirection="column" gap={1}>
                    <Button onClick={open} variant="outlined" size="small">
                        Select file
                    </Button>

                    <Box
                        {...getRootProps()}
                        sx={(theme) => ({
                            borderWidth: "1px",
                            borderStyle: "dashed",
                            borderColor: isDragActive
                                ? theme.palette.primary.main
                                : "#CCCCCC",
                            borderRadius: "8px",
                            width: "100%",
                            height: "100px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        })}
                    >
                        <Typography>
                            {isDragActive
                                ? "Drop file here"
                                : "or drag file here"}
                        </Typography>
                    </Box>
                </Box>
            ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                    <Typography fontWeight={500}>
                        Selected file: {filename}
                    </Typography>

                    <Button onClick={open} variant="outlined" size="small">
                        Select another file
                    </Button>

                    <Button
                        onClick={() => onChange(null)}
                        variant="outlined"
                        size="small"
                        color="error"
                    >
                        Clear
                    </Button>
                </Box>
            )}
        </Box>
    );
};

interface IUploadCredentialsDialogProps {
    id: number;
    open: boolean;
    onClose: () => void;
}

const UploadCredentialsDialog: FC<IUploadCredentialsDialogProps> = ({
    id,
    open,
    onClose,
}) => {
    const [credsType, setCredsType] = useState<string>("ssh");
    const [file, setFile] = useState<File | null>(null);
    const [credsValid, setCredsValid] = useState(false);

    const [uploadAttachment, { isLoading: isUploading }] =
        sharedApi.useUploadAttachmentMutation();

    const [uploadCredentials, { isLoading }] =
        employeesApi.useUploadCounteragentCredentialsMutation();

    const handleClickUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await uploadAttachment(formData).unwrap();

            await uploadCredentials({
                id,
                type: credsType,
                url: res.payload.url,
            }).unwrap();

            onClose();
            toast.success("Credentials uploaded successfully");
        } catch (error) {
            toastError(error);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box display="flex" flexDirection="column" gap={1}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography fontWeight={500}>Upload credentials</Typography>

                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <FormGroup>
                    <FormControl sx={{ mt: 1 }}>
                        <InputLabel id="creds-type" size="small">
                            Credentials type
                        </InputLabel>
                        <Select
                            id="creds-type"
                            labelId="creds-type"
                            label="Credentials type"
                            value={credsType}
                            onChange={(e) => setCredsType(e.target.value)}
                            size="small"
                        >
                            <MenuItem value="ssh">SSH key</MenuItem>
                            <MenuItem value="certificate">Certificate</MenuItem>
                            <MenuItem value="openvpn">OpenVPN</MenuItem>
                            <MenuItem value="pvpn">PVPN</MenuItem>
                        </Select>
                    </FormControl>
                </FormGroup>

                <UploadFile onChange={setFile} />

                {/* <Typography fontSize={14}>
                    Warning: When uploading a new certificate, OpenVPN will be
                    out of date
                </Typography> */}

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={credsValid}
                            onChange={(e) => setCredsValid(e.target.checked)}
                        />
                    }
                    label="I confirm that the credentials are correct and valid"
                />

                <LoadingButton
                    onClick={handleClickUpload}
                    variant="outlined"
                    size="small"
                    loading={isUploading || isLoading}
                    disabled={!file || !credsValid}
                >
                    Upload
                </LoadingButton>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    size="small"
                    color="error"
                    disabled={isUploading || isLoading}
                >
                    Cancel
                </Button>
            </Box>
        </Modal>
    );
};

export { UploadCredentialsDialog };
