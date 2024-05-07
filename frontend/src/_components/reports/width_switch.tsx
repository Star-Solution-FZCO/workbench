import ExpandIcon from "@mui/icons-material/Expand";
import VerticalAlignCenterIcon from "@mui/icons-material/VerticalAlignCenter";
import { IconButton, Tooltip } from "@mui/material";
import { changeTableWidthMode, useAppDispatch, useAppSelector } from "_redux";

const ReportTableWidthSwitch = () => {
    const dispatch = useAppDispatch();
    const mode = useAppSelector((state) => state.shared.tableWidthMode);

    const handleClick = () => {
        dispatch(changeTableWidthMode());
    };

    const isFullWidth = mode === "fullWidth";

    return (
        <Tooltip
            title={isFullWidth ? "Full width" : "Fit by content"}
            placement="top"
        >
            <IconButton
                sx={{ transform: "rotate(90deg)" }}
                onClick={handleClick}
                size="small"
            >
                {isFullWidth ? <ExpandIcon /> : <VerticalAlignCenterIcon />}
            </IconButton>
        </Tooltip>
    );
};

export { ReportTableWidthSwitch };
