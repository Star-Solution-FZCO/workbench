import { LoadingButton } from "@mui/lab";
import { Box, Pagination, Typography } from "@mui/material";
import {
    GridColDef,
    GridEventListener,
    GridRowSelectionModel,
    GridSortModel,
} from "@mui/x-data-grid";
import { DataGridPro } from "@mui/x-data-grid-pro";
import { Employee, ListStateT, initialListState } from "_components";
import { employeesApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CounteragentT } from "types";
import { calculatePageCount } from "utils";
import { formatDateTimeHumanReadable } from "utils/convert";

const counteragentsListInitialState: ListStateT = {
    ...initialListState,
    filter: {
        status: "status:VALID",
        group: "group:false",
    },
    sort_by: [{ columnKey: "english_name", direction: "ASC" }],
};

const CounteragentValidate = () => {
    const navigate = useNavigate();

    const profile = useAppSelector((state) => state.profile.payload);

    const [page, setPage] = useState(1);
    const [listState, setListState] = useState({
        ...counteragentsListInitialState,
        filter: {
            ...counteragentsListInitialState.filter,
            manager_id: `manager_id:${profile.id}`,
        },
    });

    const [rowSelectionModel, setRowSelectionModel] =
        useState<GridRowSelectionModel>([]);

    const { data, isLoading, isFetching } =
        employeesApi.useListCounteragentQuery(makeListParams(listState, []));

    const [bulkInvalidateCounteragent] =
        employeesApi.useBulkInvalidateCounteragentMutation();

    const handleInvalidate = () => {
        const confirmed = confirm(
            "Are you sure you want to invalidate selected counteragents?",
        );
        if (!confirmed) return;

        bulkInvalidateCounteragent({
            agents: rowSelectionModel as number[],
            apply_subagents: false,
        }).then(() => {
            navigate("/counteragents");
            toast.success("Counteragents successfully invalidated");
        });
    };

    const columns = useMemo<GridColDef<CounteragentT>[]>(
        () => [
            {
                field: "english_name",
                headerName: "English name",
                flex: 1,
            },
            {
                field: "email",
                headerName: "E-mail",
                flex: 2,
            },
            {
                field: "manager",
                headerName: "Manager",
                sortable: false,
                filterable: false,
                flex: 1,
                valueGetter: (_, row) => row.manager.value,
                renderCell: ({ row }) => (
                    <Employee
                        employee={{
                            id: row.manager.value as number,
                            english_name: row.manager.label,
                            pararam: row.manager.label,
                        }}
                    />
                ),
            },
            {
                field: "agents",
                headerName: "Subagents",
                sortable: false,
                flex: 1,
                valueGetter: (_, row) => (row.group ? row.agents.length : null),
            },
            {
                field: "team",
                headerName: "Team",
                sortable: false,
                flex: 1,
                renderCell: ({ row }) => row.team?.label,
            },
            {
                field: "team_required",
                headerName: "Team required",
                type: "boolean",
            },
            {
                field: "created",
                headerName: "Created",
                flex: 1,
                renderCell: ({ row }) =>
                    formatDateTimeHumanReadable(row.created),
            },
            {
                field: "updated",
                headerName: "Updated",
                flex: 1,
                renderCell: ({ row }) =>
                    formatDateTimeHumanReadable(row.updated),
            },
        ],
        [],
    );

    const handleRowClick: GridEventListener<"rowClick"> = (params) => {
        navigate(`/counteragents/view/${params.row.id}`);
    };

    const handleListStateChange = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (name: keyof ListStateT) => (value: any) => {
            setListState({
                ...listState,
                offset: name !== "search" ? listState.offset : 0,
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

    const handleRowSelectionModelChange = (
        newRowSelectionModel: GridRowSelectionModel,
    ) => {
        setRowSelectionModel(newRowSelectionModel);
    };

    const count = calculatePageCount(listState.limit, data?.payload?.count);

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Typography fontSize={20} fontWeight={500}>
                Select the counteragents to invalidate
            </Typography>

            <LoadingButton
                onClick={handleInvalidate}
                sx={{ alignSelf: "flex-start" }}
                variant="outlined"
                size="small"
                disabled={!rowSelectionModel.length}
                loading={isLoading}
            >
                Invalidate
            </LoadingButton>

            <DataGridPro
                sx={{
                    "& .MuiDataGrid-row": {
                        cursor: "pointer",
                    },
                }}
                columns={columns}
                rows={data?.payload?.items || []}
                initialState={{
                    sorting: {
                        sortModel: [
                            {
                                field: "english_name",
                                sort: "asc",
                            },
                        ],
                    },
                }}
                onRowClick={handleRowClick}
                onSortModelChange={handleSortModelChange}
                rowSelectionModel={rowSelectionModel}
                onRowSelectionModelChange={handleRowSelectionModelChange}
                loading={isLoading || isFetching}
                density="compact"
                sortingMode="server"
                checkboxSelection
                keepNonExistentRowsSelected
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

                {data?.payload?.count ? (
                    <Typography fontSize={14}>
                        Total results: {data.payload.count}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    );
};

export { CounteragentValidate };
