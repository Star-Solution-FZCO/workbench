import SettingsIcon from "@mui/icons-material/Settings";
import { Avatar, Box, Button, Chip, Divider, Typography } from "@mui/material";
import {
    DataGridPro,
    GridColDef,
    GridEventListener,
    GridToolbar,
} from "@mui/x-data-grid-pro";
import { helpCenterApi, useAppSelector } from "_redux";
import { YOUTRACK_URL } from "config";
import { format } from "date-fns";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ListHelpCenterRequestParamsT, YTIssueT } from "types";
import { toastError } from "utils";
import { Link } from "./link";

const queryParams: ListHelpCenterRequestParamsT = {
    limit: 3,
    offset: 0,
    requester: "me",
};

const LastRequests = () => {
    const navigate = useNavigate();
    const profile = useAppSelector((state) => state.profile.payload);
    const canEdit = profile.admin || profile.hr;

    const {
        data: requests,
        isLoading,
        isFetching,
        error,
    } = helpCenterApi.useListHelpCenterRequestQuery(queryParams);

    const columns: GridColDef<YTIssueT>[] = [
        {
            field: "idReadable",
            headerName: "Reference",
            flex: 1,
        },
        {
            field: "summary",
            headerName: "Summary",
            flex: 1,
        },
        {
            field: "status",
            headerName: "Status",
            flex: 1,
            renderCell: ({ row }) => (
                <Chip
                    label={
                        row.customFields.find((cf) => cf.name === "State")
                            ?.value?.name
                    }
                    size="small"
                />
            ),
        },
        {
            field: "reporter",
            headerName: "Requester",
            flex: 1,
            renderCell: ({ row }) => (
                <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                        src={YOUTRACK_URL + row.reporter.avatarUrl}
                        sx={{ width: "24px", height: "24px" }}
                    />
                    <Typography fontSize={14}>
                        {row.reporter.fullName}
                    </Typography>
                </Box>
            ),
        },
        {
            field: "created",
            headerName: "Created",
            flex: 1,
            valueGetter: (_, row) =>
                format(new Date(row.created), "dd MMM yyyy HH:mm"),
        },
        {
            field: "updated",
            headerName: "Updated",
            flex: 1,
            valueGetter: (_, row) =>
                format(new Date(row.updated), "dd MMM yyyy HH:mm"),
        },
        {
            field: "assignee",
            headerName: "Assignee",
            flex: 1,
            renderCell: ({ row }) =>
                row.customFields.find((cf) => cf.name === "Assignee")?.value
                    ?.name,
        },
    ];

    const handleRowClick: GridEventListener<"rowClick"> = (params) => {
        navigate(`/help-center/requests/${params.row.idReadable}`);
    };

    useEffect(() => {
        if (error) {
            toastError(error);
        }
    }, [error]);

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box display="flex" alignItems="center" gap={1}>
                <Typography fontWeight={500}>My Requests</Typography>
                <Link to="requests">All Requests</Link>

                {canEdit && (
                    <Button
                        onClick={() => navigate("admin/services")}
                        variant="outlined"
                        color="secondary"
                        size="small"
                        endIcon={<SettingsIcon />}
                    >
                        Admin Panel
                    </Button>
                )}
            </Box>

            <Divider flexItem />

            <DataGridPro
                sx={{
                    "& .MuiDataGrid-row": {
                        cursor: "pointer",
                    },
                }}
                columns={columns}
                slots={{
                    toolbar: GridToolbar,
                }}
                rows={requests?.payload?.items || []}
                onRowClick={handleRowClick}
                loading={isLoading || isFetching}
                density="compact"
                hideFooter
                autoHeight
            />

            <Divider flexItem />
        </Box>
    );
};

export default LastRequests;
