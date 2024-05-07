import { Box, Tooltip } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { Employee } from "_components";
import { requestsApi, useAppSelector } from "_redux";
import { formatInTimeZone } from "date-fns-tz";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DismissEmployeeRequest } from "types/models";
import { RequestListView } from "./request_list_view";
import { requestIconColor, requestListInitialParams } from "./utils";

const DismissEmployeeRequestListView = () => {
    const navigate = useNavigate();

    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "UTC";

    const columns = useMemo<GridColDef<DismissEmployeeRequest>[]>(
        () => [
            {
                field: "status",
                headerName: "Status",
                width: 80,
                valueGetter: (_, row) => row.status,
                renderCell: ({ row }) => (
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        height="100%"
                    >
                        <Tooltip title={row.status}>
                            <Box
                                width={20}
                                height={20}
                                sx={{
                                    backgroundColor: requestIconColor(
                                        row.status,
                                    ),
                                    borderRadius: 16,
                                }}
                            />
                        </Tooltip>
                    </Box>
                ),
            },
            {
                field: "employee_id",
                headerName: "Employee",
                flex: 1,
                valueGetter: (_, row) => row.employee.label,
                renderCell: ({ row: { employee } }) => (
                    <Employee
                        employee={{
                            id: employee.value as number,
                            english_name: employee.label,
                            pararam: employee.pararam || "",
                        }}
                    />
                ),
            },
            {
                field: "created_by_id",
                headerName: "Created By",
                flex: 1,
                valueGetter: (_, row) => row.created_by.label,
                renderCell: ({ row: { created_by } }) => (
                    <Employee
                        employee={{
                            id: created_by.value as number,
                            english_name: created_by.label,
                            pararam: created_by.pararam || "",
                        }}
                    />
                ),
            },
            {
                field: "dismiss_datetime",
                headerName: "Dismiss datetime",
                flex: 1,
                renderCell: ({ row: { dismiss_datetime } }) =>
                    formatInTimeZone(
                        dismiss_datetime + "Z",
                        timezone,
                        "dd MMM yyyy HH:mm",
                    ),
            },
            {
                field: "updated",
                headerName: "Updated",
                flex: 1,
                valueGetter: (_, row) => new Date(row.updated),
                renderCell: ({ row }) =>
                    formatInTimeZone(
                        row.updated + "Z",
                        timezone,
                        "dd MMM yyyy HH:mm:ss",
                    ),
                type: "dateTime",
            },
        ],
        [timezone],
    );

    return (
        <RequestListView
            initialParams={requestListInitialParams}
            queryFn={requestsApi.useListDismissEmployeeRequestQuery}
            columns={columns}
            datagridProps={{
                initialState: {
                    sorting: {
                        sortModel: [
                            {
                                field: "updated",
                                sort: "desc",
                            },
                        ],
                    },
                },
            }}
            onRowClick={({ row }) =>
                navigate(`/requests/dismiss-employee/${row.id}`)
            }
            request_type="DISMISS_EMPLOYEE"
            hideSearch
        />
    );
};

export { DismissEmployeeRequestListView };
