import { Box } from "@mui/material";
import { useAppSelector } from "_redux";
import { FC } from "react";
import { TableWidthModeT } from "types";

interface IReportOutputWrapperProps extends React.PropsWithChildren {
    tableWidthMode?: TableWidthModeT;
}

const ReportOutputWrapper: FC<IReportOutputWrapperProps> = ({
    children,
    tableWidthMode: tableWidthModeFromProps,
}) => {
    const tableWidthModeFromState = useAppSelector(
        (state) => state.shared.tableWidthMode,
    );
    const tableWidthMode = tableWidthModeFromProps || tableWidthModeFromState;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                overflow: "auto",
                "& table": {
                    borderSpacing: 0,
                    fontSize: 14,
                    textAlign: "center",
                    width:
                        tableWidthMode === "fitContent"
                            ? "fit-content"
                            : "100%",
                },
                "& td, th": {
                    border: "1px solid #ccc",
                    padding: "4px",
                },
                "& tbody > tr:focus": {
                    background: "#357DED !important",
                    color: "white",
                    "& svg": {
                        fill: "white",
                    },
                    "& a": {
                        color: "white",
                    },
                },
            }}
        >
            {children}
        </Box>
    );
};

export { ReportOutputWrapper };
