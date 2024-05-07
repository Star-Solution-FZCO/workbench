import FilterAltIcon from "@mui/icons-material/FilterAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SummarizeIcon from "@mui/icons-material/Summarize";
import {
    Box,
    Button,
    CircularProgress,
    FormControlLabel,
    IconButton,
    Pagination,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    DataGridPro,
    GridColDef,
    GridEventListener,
    GridSortModel,
    GridToolbar,
} from "@mui/x-data-grid-pro";
import {
    DataGridContextMenu,
    Employee,
    ListStateT,
    SearchField,
    initialListState,
} from "_components";
import { employeesApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { debounce } from "lodash";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CounteragentT } from "types/models";
import { calculatePageCount } from "utils";
import { formatDateTimeHumanReadable } from "utils/convert";
import { employeeListfilterNames } from "utils/references";
import { CounteragentListFilter } from "./components";

const counteragentsListInitialState: ListStateT = {
    ...initialListState,
    filter: { status: "status:VALID" },
    sort_by: [{ columnKey: "english_name", direction: "ASC" }],
};

const CounteragentList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const profile = useAppSelector(({ profile }) => profile.payload);
    const filterDefaultOpen = employeeListfilterNames.some((name) =>
        searchParams.has(name),
    );

    const [page, setPage] = useState(1);
    const [listState, setListState] = useState(counteragentsListInitialState);

    const [showFilter, setShowFilter] = useState(filterDefaultOpen);

    const [contextMenuEvent, setContextMenuEvent] = useState<any | null>(null);
    const [contextMenuEventCurrentTarget, setContextMenuEventCurrentTarget] =
        useState<any | null>(null);

    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        setContextMenuEvent(event);
        setContextMenuEventCurrentTarget(event.currentTarget);
    };

    const handleCloseContextMenu = () => {
        setContextMenuEvent(null);
        setContextMenuEventCurrentTarget(null);
    };

    const [getCSV, getCSVProps] =
        employeesApi.useLazyExportCounteragentsQuery();

    const { data, isLoading, isFetching } =
        employeesApi.useListCounteragentQuery(
            makeListParams(listState, ["english_name___icontains"]),
        );

    const columns = useMemo<GridColDef<CounteragentT>[]>(
        () => [
            {
                field: "english_name",
                headerName: "English name",
                flex: 1,
            },
            {
                field: "username",
                headerName: "Username",
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
                field: "group",
                headerName: "Group",
                type: "boolean",
                flex: 1,
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

    const getCSVHandle = () => {
        getCSV(
            makeListParams(listState, [
                "english_name___icontains",
                "email___icontains",
            ]),
        );
    };

    const handleChangePagination = (
        _: React.ChangeEvent<unknown>,
        page: number,
    ) => {
        setPage(page);
        handleListStateChange("offset")(listState.limit * (page - 1));
    };

    const search = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleListStateChange("search")(event.target.value);
    };

    const handleChangeSearch = useCallback(debounce(search, 300), [listState]);

    const handleSortModelChange = (sortModel: GridSortModel) => {
        handleListStateChange("sort_by")(
            sortModel.map((item) => ({
                columnKey: item.field,
                direction: item.sort?.toUpperCase(),
            })),
        );
    };

    const handleRowClick: GridEventListener<"rowClick"> = (params) => {
        navigate(`/counteragents/view/${params.row.id}`);
    };

    const count = calculatePageCount(listState.limit, data?.payload?.count);

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box display="flex" alignItems="center" gap={1}>
                <Box flex={1}>
                    <SearchField onChange={handleChangeSearch} />
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                    <FormControlLabel
                        label="Filters"
                        labelPlacement="start"
                        control={
                            <IconButton
                                onClick={() => setShowFilter(!showFilter)}
                            >
                                <FilterAltIcon />
                            </IconButton>
                        }
                    />

                    <Tooltip title="Export CSV">
                        <IconButton
                            onClick={getCSVHandle}
                            color="success"
                            disabled={getCSVProps.isLoading}
                        >
                            {getCSVProps.isLoading ? (
                                <CircularProgress size={20} color="success" />
                            ) : (
                                <SummarizeIcon />
                            )}
                        </IconButton>
                    </Tooltip>

                    {["super_hr", "hr", "recruiter", "admin"].some((role) =>
                        profile.roles?.includes(role),
                    ) && (
                        <Button
                            onClick={() => navigate("add")}
                            startIcon={<PersonAddIcon />}
                            variant="outlined"
                            size="small"
                            color="success"
                        >
                            Add counteragent
                        </Button>
                    )}
                </Box>
            </Box>

            <CounteragentListFilter
                showFilter={showFilter}
                listState={listState}
                setListState={setListState}
            />

            <DataGridPro
                sx={{
                    "& .MuiDataGrid-row": {
                        cursor: "pointer",
                    },
                }}
                columns={columns}
                rows={data?.payload?.items || []}
                slots={{
                    toolbar: GridToolbar,
                }}
                slotProps={{
                    row: {
                        onContextMenu: handleContextMenu,
                    },
                }}
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
                loading={isLoading || isFetching}
                density="compact"
                sortingMode="server"
                hideFooter
            />

            <DataGridContextMenu
                newTabPath="/counteragents/view"
                contextMenuEvent={contextMenuEvent}
                contextMenuEventCurrentTarget={contextMenuEventCurrentTarget}
                onClose={handleCloseContextMenu}
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

export { CounteragentList };
