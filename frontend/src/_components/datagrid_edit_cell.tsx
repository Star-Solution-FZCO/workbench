import EditIcon from "@mui/icons-material/Edit";
import { Box, Tooltip } from "@mui/material";
import { GridRenderCellParams } from "@mui/x-data-grid-pro";
import { FC } from "react";

interface IDGCellEditProps {
    params: GridRenderCellParams;
    onClick: (id: number, field: string) => void;
}

const DGCellEdit: FC<IDGCellEditProps> = ({
    params: { row, field },
    onClick,
}) => {
    return (
        <Box display="flex" alignItems="center" gap={1}>
            {row[field]}

            <Tooltip title="Click to edit" placement="top">
                <EditIcon
                    fontSize="small"
                    sx={{ color: "#757575", cursor: "pointer" }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick(row.id, field);
                    }}
                />
            </Tooltip>
        </Box>
    );
};

export { DGCellEdit };
