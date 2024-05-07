import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
    Box,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography,
} from "@mui/material";
import React, { ChangeEvent, useState } from "react";

type FileFieldPropsT = {
    onChange: (file: File) => Promise<void>;
};

export const FileField: React.FC<FileFieldPropsT> = ({ onChange }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isFileReady, setFileReady] = useState<boolean>(true);

    const onInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const files = e.target.files;
        if (!files) return;
        setSelectedFile(files[0]);
        setFileReady(false);
        await onChange(files[0]);
        setFileReady(true);
    };

    const formatSize = (size: number) => {
        const p = Math.floor(Math.log2(size) / 10);
        return (
            (size / Math.pow(1024, p)).toFixed(1) +
            ["Bytes", "Kb", "Mb", "Gb", "Tb"][p]
        );
    };

    return (
        <Box sx={{ display: "flex" }}>
            <input
                style={{ display: "none" }}
                id="file"
                multiple
                type="file"
                onChange={onInputChange}
            />
            <label htmlFor="file">
                <Tooltip title="Upload file">
                    <IconButton component="span" color="primary">
                        <UploadFileIcon />
                    </IconButton>
                </Tooltip>
            </label>

            {selectedFile && (
                <Box sx={{ display: "flex" }} alignItems={"center"}>
                    <Typography display={"flex"} alignItems={"center"}>
                        {selectedFile.name} ({formatSize(selectedFile.size)})
                    </Typography>

                    {!isFileReady && <CircularProgress size={24} />}
                </Box>
            )}
        </Box>
    );
};
