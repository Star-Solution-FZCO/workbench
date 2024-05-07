import SettingsIcon from "@mui/icons-material/Settings";
import {
    Avatar,
    Box,
    Button,
    Chip,
    MenuItem,
    Select,
    SelectChangeEvent,
    Typography,
} from "@mui/material";
import {
    DataGridPro,
    GridColDef,
    GridEventListener,
    GridToolbar,
} from "@mui/x-data-grid-pro";
import { SearchField } from "_components";
import { helpCenterApi, useAppSelector } from "_redux";
import { YOUTRACK_URL } from "config";
import { format } from "date-fns";
import { debounce, omit } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListHelpCenterRequestParamsT, YTIssueT } from "types";
import { toastError } from "utils";
import { Link } from "../components";

const initialParams: ListHelpCenterRequestParamsT = {
    limit: 50,
    offset: 0,
    requester: "me",
};

type StatusT = "Any" | "Open" | "Closed";
type RequesterT = "me" | "anyone" | "participant";

const RequestList = () => {
    const navigate = useNavigate();

    const profile = useAppSelector((state) => state.profile.payload);
    const adminOrHR = profile.admin || profile.hr;

    const [queryParams, setQueryParams] =
        useState<ListHelpCenterRequestParamsT>(initialParams);

    const [status, setStatus] = useState<StatusT>("Any");
    const [requester, setRequester] = useState<RequesterT>("me");

    const {
        data: requests,
        isLoading,
        isFetching,
        error,
    } = helpCenterApi.useListHelpCenterRequestQuery(queryParams);

    // const { data: services } = helpCenterApi.useListHelpCenterServiceSelectQuery();

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

    const handleChangeParams = (
        key: keyof ListHelpCenterRequestParamsT,
        value: any,
    ) => {
        if (key === "search" && !value) {
            setQueryParams(omit(queryParams, "search"));
        }
        setQueryParams({ ...queryParams, [key]: value });
    };

    const handleChangeStatus = (event: SelectChangeEvent) => {
        const status = event.target.value as StatusT;
        setStatus(status);
        handleChangeParams("status", status !== "Any" ? status : undefined);
    };

    const handleChangeRequester = (event: SelectChangeEvent) => {
        const requester = event.target.value as RequesterT;
        setRequester(requester);
        handleChangeParams(
            "requester",
            requester !== "anyone" ? requester : undefined,
        );
    };

    const search = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleChangeParams("search", event.target.value);
    };

    const handleChangeSearch = useCallback(debounce(search, 300), []);

    useEffect(() => {
        if (error) {
            toastError(error);
        }
    }, [error]);

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box display="flex" alignItems="center" gap={1}>
                <Link to="/help-center">Help center</Link>
                {adminOrHR && (
                    <Button
                        onClick={() => navigate("/help-center/admin/services")}
                        variant="outlined"
                        color="secondary"
                        size="small"
                        endIcon={<SettingsIcon />}
                    >
                        Admin Panel
                    </Button>
                )}
            </Box>

            <Box display="flex" gap={1}>
                <Select
                    size="small"
                    value={status}
                    onChange={handleChangeStatus}
                >
                    <MenuItem value="Any">Any status</MenuItem>
                    <MenuItem value="Open">Open requests</MenuItem>
                    <MenuItem value="Closed">Closed requests</MenuItem>
                </Select>

                {adminOrHR && (
                    <Select
                        size="small"
                        value={requester}
                        onChange={handleChangeRequester}
                    >
                        <MenuItem value="me">Created by me</MenuItem>
                        <MenuItem value="anyone">Created by anyone</MenuItem>
                        <MenuItem value="participant">
                            Where i am participant
                        </MenuItem>
                    </Select>
                )}

                {/* <Autocomplete
                    sx={{ width: "300px" }}
                    options={services || []}
                    onChange={(e, value) => handleChangeService(value)}
                    getOptionLabel={(option) => option.label}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Request type"
                            size="small"
                        />
                    )}
                /> */}

                <SearchField onChange={handleChangeSearch} />
            </Box>

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
            />
        </Box>
    );
};

export default RequestList;
