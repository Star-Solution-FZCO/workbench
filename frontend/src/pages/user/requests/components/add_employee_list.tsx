import { Box, Tooltip } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { requestsApi, useAppSelector } from "_redux";
import { useMemo } from "react";
import { AddEmployeeRequest } from "types/models";

import { Employee } from "_components";
import { formatInTimeZone } from "date-fns-tz";
import { useNavigate } from "react-router-dom";
import { formatDateHumanReadable } from "utils/convert";
import { RequestListView } from "./request_list_view";
import { requestIconColor, requestListInitialParams } from "./utils";

const AddEmployeeRequestListView = () => {
    const navigate = useNavigate();

    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "UTC";

    const columns = useMemo<GridColDef<AddEmployeeRequest>[]>(
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
                field: "employee_data__native_name",
                headerName: "Employee name",
                flex: 1,
                valueGetter: (_, row) => row.employee_data.native_name,
            },
            {
                field: "employee_data__work_started",
                headerName: "Work started",
                flex: 1,
                renderCell: ({ row: { employee_data } }) =>
                    employee_data.work_started
                        ? formatDateHumanReadable(employee_data.work_started)
                        : null,
                valueGetter: (_, row) =>
                    row.employee_data.work_started
                        ? new Date(row.employee_data.work_started)
                        : null,
                type: "date",
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
            queryFn={requestsApi.useListAddEmployeeRequestQuery}
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
                navigate(`/requests/add-employee/${row.id}`)
            }
            request_type="ADD_EMPLOYEE"
            search_fields={["employee_data__english_name___icontains"]}
        />
    );
};

export { AddEmployeeRequestListView };
