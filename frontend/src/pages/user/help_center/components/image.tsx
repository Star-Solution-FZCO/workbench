import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    IconButton,
    LinearProgress,
    Typography,
} from "@mui/material";
import { Modal } from "_components";
import { helpCenterApi, sharedApi } from "_redux";
import { fileMaxSize } from "config";
import { FC, useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { toastError } from "utils";
import { storageUrl } from "utils/url";

type IconT = {
    id: number;
    created: string;
    url: string;
    type: string;
};

interface IIconProps {
    icon: IconT;
    selected: boolean;
    onClick: (icon: IconT) => void;
}

const Icon: FC<IIconProps> = ({ icon, selected, onClick }) => {
    return (
        <Box
            sx={{
                width: "64px",
                height: "64px",
                cursor: "pointer",
                borderRadius: 0.5,
                outline: `1px solid ${selected ? "#2196f3" : "#dcdcdc"}`,
                boxShadow: 8,
                "& img": {
                    width: "64px",
                    height: "64px",
                    objectFit: "contain",
                },
            }}
            onClick={() => onClick(icon)}
        >
            <img src={icon.url} />
        </Box>
    );
};

interface IIconSelectorProps {
    onSelect: (url: string) => void;
}

const IconSelector: FC<IIconSelectorProps> = ({ onSelect }) => {
    const [open, setOpen] = useState(false);

    const { data: icons } = helpCenterApi.useListHelpCenterIconQuery();
    const [deleteIcon, { isLoading }] =
        helpCenterApi.useDeleteHelpCenterIconMutation();

    const [selected, setSelected] = useState<IconT | null>(null);

    const handleClickIcon = (icon: IconT) => {
        setSelected(selected?.id !== icon.id ? icon : null);
    };

    const handleClose = () => {
        setOpen(false);
        setSelected(null);
    };

    const handleClickSelect = () => {
        if (!selected) return;
        onSelect(selected.url);
        handleClose();
    };

    const handleClickDelete = () => {
        if (!selected) return;

        const confirmed = confirm("Are you sure you want to delete the icon?");
        if (!confirmed) return;

        deleteIcon(selected.id)
            .unwrap()
            .then(() => {
                setSelected(null);
                toast.success("Iicon has been successfully deleted");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    if (!icons) return null;

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                variant="outlined"
                size="small"
                color="info"
            >
                Select from gallery
            </Button>

            <Modal open={open} onClose={handleClose}>
                <Box display="flex" flexDirection="column" gap={1}>
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography fontWeight={700}>Icon gallery</Typography>

                        <IconButton sx={{ p: 0 }} onClick={handleClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box
                        display="flex"
                        flexWrap="wrap"
                        minHeight="64px"
                        maxHeight="400px"
                        overflow="auto"
                        p="1px"
                        gap={1}
                    >
                        {icons.length === 0 && (
                            <Typography>No icons</Typography>
                        )}

                        {icons.map((icon) => (
                            <Icon
                                key={icon.id}
                                icon={icon}
                                onClick={handleClickIcon}
                                selected={selected?.id === icon.id}
                            />
                        ))}
                    </Box>

                    <Box display="flex" gap={1}>
                        <Button
                            onClick={handleClickSelect}
                            variant="outlined"
                            size="small"
                            disabled={!selected}
                        >
                            Select
                        </Button>
                        <LoadingButton
                            onClick={handleClickDelete}
                            variant="outlined"
                            size="small"
                            color="error"
                            loading={isLoading}
                            disabled={!selected}
                        >
                            Delete
                        </LoadingButton>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

interface IImageUploadProps {
    label?: string;
    url?: string | null;
    onUpload: (url: string | null) => void;
}

const ImageUpload: FC<IImageUploadProps> = ({ label, url, onUpload }) => {
    const [image, setImage] = useState<File | null>(null);
    const [uploaded, setUploaded] = useState(false);

    const [uploadAttachment, { isLoading }] =
        sharedApi.useUploadAttachmentMutation();

    const upload = useCallback(
        (image: File) => {
            const formData = new FormData();
            formData.append("file", image);

            uploadAttachment(formData)
                .unwrap()
                .then((res) => {
                    const url = storageUrl(res.payload.url);
                    url && onUpload(url);
                    setUploaded(true);
                    toast.success("Image uploaded successfully");
                })
                .catch((error) => toastError(error));
        },
        [onUpload, uploadAttachment],
    );

    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: FileRejection[]) => {
            fileRejections.forEach((file) => {
                file.errors.forEach((error) => {
                    toast.error(error.message);
                });
            });

            if (acceptedFiles.length === 0) return;
            const file = acceptedFiles[0];
            setImage(file);
            upload(file);
        },
        [upload],
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        maxSize: fileMaxSize,
        accept: {
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/svg+xml": [".svg"],
        },
        multiple: false,
    });

    const clear = () => {
        onUpload(null);
        setImage(null);
        setUploaded(false);
    };

    return (
        <>
            {(image || url) && (
                <Box
                    display="flex"
                    flexDirection="column"
                    gap={1}
                    sx={{
                        "& img": {
                            width: "64px",
                            height: "64px",
                            objectFit: "contain",
                        },
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography>
                            {label || "Image"}: {image?.name}
                        </Typography>

                        {uploaded && <CheckIcon fontSize="small" />}
                    </Box>

                    <img
                        src={image ? URL.createObjectURL(image) : url || ""}
                        alt={image?.name}
                    />

                    {isLoading && !uploaded && <LinearProgress />}

                    <Box display="flex" gap={1}>
                        <Button
                            onClick={clear}
                            variant="outlined"
                            size="small"
                            color="error"
                        >
                            Clear
                        </Button>

                        <IconSelector onSelect={onUpload} />
                    </Box>
                </Box>
            )}

            <Box
                display={image || url ? "none" : "flex"}
                flexDirection="column"
                gap={1}
                alignItems="flex-start"
            >
                <Typography>Image maximum size: 3 MB</Typography>

                <Box display="flex" gap={1}>
                    <Button onClick={open} variant="outlined" size="small">
                        Select {label || "image"}
                    </Button>

                    <IconSelector onSelect={onUpload} />
                </Box>

                <input {...getInputProps()} />

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
                            ? "Drop image here"
                            : "or drag image here"}
                    </Typography>
                </Box>
            </Box>
        </>
    );
};

export { ImageUpload };
