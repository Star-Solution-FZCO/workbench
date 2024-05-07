import DeleteIcon from "@mui/icons-material/Delete";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import SaveIcon from "@mui/icons-material/Save";
import { LoadingButton } from "@mui/lab";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { employeesApi } from "_redux";
import { setProfileInfo } from "_redux/utils";
import { fileMaxSize } from "config";
import "cropperjs/dist/cropper.css";
import React, { useCallback, useRef, useState } from "react";
import ReactCropper, { ReactCropperElement } from "react-cropper";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { toastError } from "utils";
import { dataURItoBlob } from "utils/convert";

const makeStylesForPreview = (size: number, rounded?: boolean) => {
    return {
        width: `${size}px`,
        height: `${size}px`,
        overflow: "hidden",
        borderRadius: rounded ? "50%" : "16px",
    };
};

interface IAvatarFieldProps {
    userId: number;
    imageURL?: string | null;
    onModalClose: () => void;
}

export const AvatarField: React.FC<IAvatarFieldProps> = ({
    userId,
    imageURL,
    onModalClose,
}) => {
    const theme = useTheme();

    const [image, setImage] = useState<string>(imageURL || "");
    const [filename, setFilename] = useState("");
    const [uploading, setUploading] = useState(false);

    const cropperRef = useRef<ReactCropperElement>(null);

    const [updatePhoto] = employeesApi.useUpdateEmployeePhotoMutation();
    const [deletePhoto] = employeesApi.useDeleteEmployeePhotoMutation();

    const [getProfile] = employeesApi.useLazyGetProfileQuery();

    const updateProfile = () => {
        getProfile()
            .unwrap()
            .then((profileData) => {
                setProfileInfo(profileData.payload);
            });
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setFilename(acceptedFiles[0].name);

        const reader = new FileReader();

        reader.onload = () => {
            const data = (reader.result as string) || "";
            setImage(data);
        };

        reader.readAsDataURL(acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        maxSize: fileMaxSize,
        accept: {
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
        },
        multiple: false,
    });

    const getCropper = (): Cropper => cropperRef?.current?.cropper as Cropper;

    const updateImage = (value: string | null, filename: string) => {
        if (!value) return;

        const blob = dataURItoBlob(value);

        const body = new FormData();
        body.append("file", blob, filename);

        setUploading(true);

        updatePhoto({ id: userId, body })
            .unwrap()
            .then(() => {
                onModalClose();
                toast.success("Photo uploaded");
                updateProfile();
            })
            .catch((error) => {
                toastError(error);
            })
            .finally(() => {
                setUploading(false);
            });
    };

    const deleteImage = () => {
        deletePhoto({
            id: userId,
        })
            .unwrap()
            .then(() => {
                onModalClose();
                toast.success("Photo deleted");
            })
            .catch((error) => {
                toastError(error);
            })
            .finally(() => {
                setUploading(false);
            });
    };

    const handleSave = () => {
        const DataURL = getCropper().getCroppedCanvas()?.toDataURL() || null;
        updateImage(DataURL, filename);
    };

    return (
        <Box display="flex" flexDirection="column" gap="16px">
            <input {...getInputProps()} />

            {!image ? (
                <Box
                    width="100%"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap="8px"
                >
                    <Typography>Image maximum size: 3 MB</Typography>

                    <Button onClick={open} variant="outlined">
                        Select image
                    </Button>

                    <Box
                        {...getRootProps()}
                        sx={{
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
                        }}
                    >
                        <Typography>
                            {isDragActive
                                ? "Drop image here"
                                : "or drag image here"}
                        </Typography>
                    </Box>
                </Box>
            ) : (
                <>
                    <Box display="flex" justifyContent="space-between">
                        <Button
                            onClick={() => setImage("")}
                            variant="outlined"
                            color="secondary"
                        >
                            <InsertPhotoIcon />
                            &nbsp; Select photo
                        </Button>

                        <Box display="flex" gap="8px">
                            <Button
                                onClick={deleteImage}
                                variant="outlined"
                                color="error"
                                disabled={!imageURL}
                            >
                                <DeleteIcon />
                                &nbsp; Delete
                            </Button>

                            <LoadingButton
                                onClick={handleSave}
                                variant="outlined"
                                loading={uploading}
                            >
                                <SaveIcon />
                                &nbsp; Save
                            </LoadingButton>
                        </Box>
                    </Box>

                    <ReactCropper
                        preview="#preview-container"
                        src={image}
                        ref={cropperRef}
                        style={{
                            width: "100%",
                            height: 400,
                            overflow: "hidden",
                        }}
                        zoomTo={0.5}
                        initialAspectRatio={16 / 9}
                        aspectRatio={1}
                        autoCropArea={1}
                        viewMode={1}
                        minCropBoxHeight={10}
                        minCropBoxWidth={10}
                        checkOrientation={false}
                        background={false}
                        responsive
                        guides
                        restore
                    />

                    <Typography variant="h6">Preview</Typography>

                    <Box
                        display="flex"
                        justifyContent="space-between"
                        gap="16px"
                    >
                        <Box
                            id="preview-container"
                            sx={makeStylesForPreview(128, true)}
                        />

                        <Box
                            id="preview-container"
                            sx={makeStylesForPreview(200)}
                        />

                        <Box
                            id="preview-container"
                            sx={makeStylesForPreview(300)}
                        />
                    </Box>
                </>
            )}
        </Box>
    );
};
