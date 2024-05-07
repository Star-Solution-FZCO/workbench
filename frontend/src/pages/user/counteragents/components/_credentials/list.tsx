import { Box, Pagination, Typography } from "@mui/material";
import { GridColDef, GridSortModel, GridToolbar } from "@mui/x-data-grid";
import { DataGridPro } from "@mui/x-data-grid-pro";
import { Employee, ListStateT, initialListState } from "_components";
import { employeesApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { formatInTimeZone } from "date-fns-tz";
import { FC, useCallback, useMemo, useState } from "react";
import { CounteragentCredentialsT } from "types";
import { calculatePageCount } from "utils";
import { NotificationType } from "./utils";

interface ICredentailsListProps {
    id: number;
}

const CredendentailsList: FC<ICredentailsListProps> = ({ id }) => {
    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "UTC";

    const [page, setPage] = useState(1);
    const [listState, setListState] = useState<ListStateT>({
        ...initialListState,
        filter: { counteragent_id: "counteragent_id:" + id },
        sort_by: [{ columnKey: "created", direction: "DESC" }],
    });

    const {
        data: credentials,
        isLoading,
        isFetching,
    } = employeesApi.useListCounteragentCredentialsQuery(
        makeListParams(listState, []),
    );

    const columns = useMemo<GridColDef<CounteragentCredentialsT>[]>(
        () => [
            {
                field: "request_id",
                headerName: "Request ID",
                flex: 1,
                sortable: false,
            },
            {
                field: "created_by",
                headerName: "Created by",
                flex: 1,
                sortable: false,
                valueGetter: (_, row) => row.created_by.english_name,
                renderCell: ({ row }) => <Employee employee={row.created_by} />,
            },
            {
                field: "bundle",
                headerName: "Credentials bundle",
                flex: 1,
                sortable: false,
                valueGetter: (_, row) =>
                    Object.entries(row.bundle)
                        .filter(([_, value]) => value)
                        .map(([key, _]) => key),
            },
            {
                field: "notifications",
                headerName: "Notification channels",
                flex: 1,
                sortable: false,
                valueGetter: (_, row) =>
                    row.notifications
                        .map((n) => `${NotificationType[n.type]} - ${n.value}`)
                        .join(", "),
            },
            { field: "status", headerName: "Status", flex: 1 },
            {
                field: "created",
                headerName: "Created",
                flex: 1,
                valueGetter: (_, row) => new Date(row.created),
                renderCell: ({ row }) =>
                    formatInTimeZone(
                        row.created + "Z",
                        timezone,
                        "dd MMM yyyy HH:mm:ss",
                    ),
                type: "dateTime",
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

    const handleListStateChange = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (name: keyof ListStateT) => (value: any) => {
            setListState({
                ...listState,

                [name]: value,
            });
        },
        [listState],
    );

    const handleSortModelChange = (sortModel: GridSortModel) => {
        handleListStateChange("sort_by")(
            sortModel.map((item) => ({
                columnKey: item.field,
                direction: item.sort?.toUpperCase(),
            })),
        );
    };

    const handleChangePagination = (
        _: React.ChangeEvent<unknown>,
        page: number,
    ) => {
        setPage(page);
        handleListStateChange("offset")(listState.limit * (page - 1));
    };

    const count = calculatePageCount(
        listState.limit,
        credentials?.payload?.count,
    );

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <DataGridPro
                columns={columns}
                rows={credentials?.payload?.items || []}
                slots={{
                    toolbar: GridToolbar,
                }}
                initialState={{
                    sorting: {
                        sortModel: [
                            {
                                field: "created",
                                sort: "desc",
                            },
                        ],
                    },
                }}
                onSortModelChange={handleSortModelChange}
                getRowHeight={() => "auto"}
                loading={isLoading || isFetching}
                density="compact"
                sortingMode="server"
                hideFooter
            />

            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {count > 1 && (
                    <Pagination
                        page={page}
                        count={count}
                        onChange={handleChangePagination}
                    />
                )}

                {credentials?.payload?.count ? (
                    <Typography fontSize={14}>
                        Total results: {credentials.payload.count}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    );
};

export { CredendentailsList };
