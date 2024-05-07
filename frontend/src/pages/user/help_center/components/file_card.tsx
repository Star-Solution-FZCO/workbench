import ClearIcon from "@mui/icons-material/Clear";
import { Box, Chip, Typography } from "@mui/material";
import { FC } from "react";

const FileCard: FC<{ file: File; onDelete: (file: File) => void }> = ({
    file,
    onDelete,
}) => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            gap={0.5}
            p={1}
            width="120px"
            height="80px"
            border="1px solid #ccc"
            borderRadius={1}
            position="relative"
        >
            <ClearIcon
                sx={{
                    position: "absolute",
                    top: 8,
                    right: 4,
                    cursor: "pointer",
                }}
                onClick={() => onDelete(file)}
            />
            <Chip
                sx={{ alignSelf: "flex-start" }}
                label={file.name.split(".")[1].toUpperCase()}
                size="small"
            />
            <Typography
                title={file.name}
                sx={{
                    fontSize: 14,
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    wordWrap: "break-word",
                }}
            >
                {file.name}
            </Typography>
        </Box>
    );
};

export { FileCard };
