import { Box, Pagination, Typography } from "@mui/material";
import { DataGridPro, GridColDef } from "@mui/x-data-grid-pro";
import { employeesApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { formatInTimeZone } from "date-fns-tz";
import { FC, useCallback, useState } from "react";
import {
    ApiResponse,
    EmployeeHistoryRecordT,
    EmployeeT,
    ListResponseT,
    UserInfoT,
} from "types";
import { calculatePageCount } from "utils";
import { Employee } from "./employee";
import { ListStateT, initialListState } from "./views";

type ManagerHistoryRecordT = {
    audit_id: number;
    user: UserInfoT | null;
    action: string;
    time: string;
};

const getEmployeeIdList = (
    historyResponse:
        | ApiResponse<ListResponseT<EmployeeHistoryRecordT>>
        | undefined,
) => {
    if (!historyResponse) return [];

    const histories = historyResponse.payload.items;

    if (histories) {
        const idList = histories
            .filter(
                (history) =>
                    history.added.length > 0 || history.deleted.length > 0,
            )
            .flatMap((history) => [...history.added, ...history.deleted]);

        return [...new Set(idList)];
    }

    return [];
};

const transformHistory = (
    historyResponse:
        | ApiResponse<ListResponseT<EmployeeHistoryRecordT>>
        | undefined,
    employeeResponse: ApiResponse<ListResponseT<EmployeeT>> | undefined,
): ManagerHistoryRecordT[] => {
    if (!historyResponse || !employeeResponse) return [];

    const histories = historyResponse.payload.items;
    const employees = employeeResponse.payload.items;

    if (histories && employees) {
        return histories.map((history) => {
            const action = history.deleted.length
                ? "Manager removed"
                : history.added.length
                  ? "Manager added"
                  : "N/A";

            const user = history.deleted.length
                ? employees.find(
                      (employee) => employee.id === history.deleted[0],
                  )
                : employees.find(
                      (employee) => employee.id === history.added[0],
                  );

            const time = history.time;

            return {
                audit_id: history.audit_id,
                user: user
                    ? {
                          id: user.id,
                          english_name: user.english_name,
                          pararam: user.pararam,
                      }
                    : null,
                action,
                time,
            };
        });
    }

    return [];
};

interface IEmployeeHistoryProps {
    id: number;
}

const getColumns = (timezone: string) => {
    const columns: GridColDef<ManagerHistoryRecordT>[] = [
        {
            field: "action",
            headerName: "Action",
            sortable: false,
            flex: 1,
            renderCell: ({ row }) => row.action,
        },
        {
            field: "user",
            headerName: "Person",
            sortable: false,
            flex: 1,
            valueGetter: (_, row) => row?.user?.english_name || "",
            renderCell: ({ row }) =>
                row.user ? <Employee employee={row.user} /> : null,
        },
        {
            field: "time",
            headerName: "Time",
            flex: 1,
            renderCell: ({ row }) =>
                formatInTimeZone(
                    new Date(row.time),
                    timezone,
                    "dd MMM yyyy HH:mm:ss",
                ),
        },
    ];

    return columns;
};

const historyListInitialState: ListStateT = {
    ...initialListState,
    sort_by: [{ columnKey: "time", direction: "DESC" }],
};

const EmployeeHistory: FC<IEmployeeHistoryProps> = ({ id }) => {
    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "GMT";

    const [page, setPage] = useState(1);
    const [listState, setListState] = useState(historyListInitialState);

    const {
        data: history,
        isLoading: historyLoading,
        isFetching: historyFetching,
    } = employeesApi.useGetEmployeeHistoryQuery({
        ...makeListParams(listState, []),
        id,
        field: "managers",
    });

    const employeeIdList = getEmployeeIdList(history);

    const {
        data: employees,
        isLoading: employeesLoading,
        isFetching: employeesFetching,
    } = employeesApi.useListEmployeeQuery(
        {
            ...makeListParams(
                {
                    ...initialListState,
                    filter: {
                        id: "id___in:" + employeeIdList.join(","),
                    },
                },
                [],
            ),
        },
        {
            skip: !employeeIdList.length,
        },
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

    const handleChangePagination = (
        _: React.ChangeEvent<unknown>,
        page: number,
    ) => {
        setPage(page);
        handleListStateChange("offset")(listState.limit * (page - 1));
    };

    const loading =
        historyLoading ||
        employeesLoading ||
        historyFetching ||
        employeesFetching;

    const data = transformHistory(history, employees);

    const count = calculatePageCount(listState.limit, history?.payload?.count);

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <DataGridPro
                columns={getColumns(timezone)}
                rows={data}
                getRowId={(row) => row.audit_id}
                initialState={{
                    sorting: {
                        sortModel: [
                            {
                                field: "time",
                                sort: "desc",
                            },
                        ],
                    },
                }}
                loading={loading}
                density="compact"
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
                {history?.payload?.count ? (
                    <Typography fontSize={14}>
                        Total results: {history.payload.count}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    );
};
export { EmployeeHistory };
