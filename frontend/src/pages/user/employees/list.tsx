import CalendarViewMonthIcon from "@mui/icons-material/CalendarViewMonth";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ListIcon from "@mui/icons-material/List";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SummarizeIcon from "@mui/icons-material/Summarize";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
    Box,
    Button,
    Checkbox,
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
} from "@mui/x-data-grid-pro";
import {
    DataGridContextMenu,
    Employee,
    EmployeeListFilter,
    ListStateT,
    SearchField,
    initialListState,
} from "_components";
import DayTypeIconButton from "_components/day_type_icon";
import WatchModal from "_components/watch_modal";
import { employeesApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import HierarchyIcon from "assets/icons/hierarchy";
import { debounce } from "lodash";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EmployeeT } from "types/models";
import { calculatePageCount, hasAccessByRoles } from "utils";
import {
    formatDateHumanReadable,
    formatDateTimeHumanReadable,
} from "utils/convert";
import { employeeListfilterNames } from "utils/references";
import { CustomGridToolbar } from "./components/custom_gridtoolbar";
import EmployeeCardList from "./components/employee_card_list";

const userEmployeesListInitialState: ListStateT = {
    ...initialListState,
    filter: { active: "active:true" },
    sort_by: [{ columnKey: "english_name", direction: "ASC" }],
};

export const UserEmployees = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const roles = useAppSelector(({ profile }) => profile.payload.roles) || [];
    const filterDefaultOpen = employeeListfilterNames.some((name) =>
        searchParams.has(name),
    );

    const [page, setPage] = useState(1);
    const [listState, setListState] = useState(userEmployeesListInitialState);

    const [showFilter, setShowFilter] = useState(filterDefaultOpen);
    const [openWatchEmployeeModal, setOpenWatchEmployeeModal] =
        useState<boolean>(false);
    const [watchingEmployee, setWatchingEmployee] = useState<EmployeeT | null>(
        null,
    );
    const [displayMode, setDisplayMode] = useState<"grid" | "card">("grid");

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

    const [getCSV, getCSVProps] = employeesApi.useLazyExportEmployeesQuery();

    const {
        data,
        isLoading: isLoading,
        isFetching,
    } = employeesApi.useListEmployeeQuery(
        makeListParams(listState, [
            "english_name___icontains",
            "native_name___icontains",
            "email___icontains",
            "pararam___icontains",
        ]),
    );

    const columns = useMemo<GridColDef<EmployeeT>[]>(() => {
        const columns: GridColDef<EmployeeT>[] = [
            {
                field: "Actions",
                sortable: false,
                resizable: false,
                filterable: false,
                disableColumnMenu: true,
                disableReorder: true,
                width: 70,
                renderCell: ({ row }) => (
                    <Box
                        key={row.id}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        width="100%"
                        height="100%"
                    >
                        <Tooltip
                            title={
                                row.is_current_user_watch
                                    ? "Unwatch person"
                                    : "Watch person"
                            }
                        >
                            <Checkbox
                                checked={row.is_current_user_watch}
                                sx={{ p: 0, color: "#757575" }}
                                onClick={(e) =>
                                    handleClickWatchEmployee(e, row)
                                }
                                icon={<VisibilityIcon />}
                                checkedIcon={<VisibilityOffIcon />}
                                size="small"
                                color="info"
                            />
                        </Tooltip>
                    </Box>
                ),
            },
            {
                field: "Today schedule status",
                headerName: "",
                sortable: false,
                resizable: false,
                filterable: false,
                disableColumnMenu: true,
                disableReorder: true,
                width: 50,
                renderCell: ({ row }) => (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        width="100%"
                        height="100%"
                    >
                        <DayTypeIconButton
                            id={row.id}
                            dayType={row.today_schedule_status}
                        />
                    </Box>
                ),
            },
            {
                field: "english_name",
                headerName: "Name",
                flex: 1,
                renderCell: ({ row }) => <Employee employee={row} />,
            },
            { field: "account", headerName: "Account", flex: 1 },
            { field: "email", headerName: "Email", flex: 1 },
            { field: "pararam", headerName: "Pararam", flex: 1 },
            {
                field: "team",
                headerName: "Team",
                sortable: false,
                filterable: false,
                flex: 1,
                renderCell: ({ row }) => row.team?.label,
            },
            {
                field: "team_position",
                headerName: "Team role",
                flex: 1,
            },
            {
                field: "position",
                headerName: "Position",
                sortable: false,
                filterable: false,
                flex: 1,
                renderCell: ({ row }) => row.position?.label,
            },
            {
                field: "grade",
                headerName: "Grade",
                sortable: false,
                filterable: false,
                flex: 1,
                renderCell: ({ row }) => row?.grade?.grade || "",
            },
            {
                field: "created",
                headerName: "Created at",
                flex: 1,
                renderCell: ({ row }) =>
                    formatDateTimeHumanReadable(row.created),
            },
            {
                field: "work_started",
                headerName: "Work started",
                flex: 1,
                renderCell: ({ row }) =>
                    formatDateHumanReadable(row.work_started),
            },
            {
                field: "work_ended",
                headerName: "Work ended",
                flex: 1,
                renderCell: ({ row }) =>
                    row.work_ended && formatDateHumanReadable(row.work_ended),
            },
        ];

        const commonRoles = ["super_hr", "hr", "recruiter"];
        if (hasAccessByRoles([...commonRoles, "finance"], roles)) {
            columns.splice(7, 0, {
                field: "cooperation_type",
                headerName: "Cooperation type",
                sortable: false,
                filterable: false,
                flex: 1,
                renderCell: ({ row }) => row.cooperation_type?.label,
            });
        }
        if (
            hasAccessByRoles(
                [...commonRoles, "super_admin", "admin", "procurement"],
                roles,
            )
        ) {
            columns.push({
                field: "pool",
                headerName: "Pool",
                flex: 1,
                valueGetter: (_, row) => row.pool?.label,
            });
        }

        return columns;
    }, [roles]);

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
                "native_name___icontains",
                "email___icontains",
                "pararam___icontains",
            ]),
        );
    };

    const handleClickWatchEmployee = (
        event: React.MouseEvent<HTMLButtonElement>,
        employee: EmployeeT,
    ) => {
        event.stopPropagation();
        setWatchingEmployee(employee);
        setOpenWatchEmployeeModal(true);
    };

    const handleCloseWatchEmployeeModal = () => {
        setWatchingEmployee(null);
        setOpenWatchEmployeeModal(false);
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
        navigate(`/people/view/${params.row.id}`);
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

                    <Tooltip title={displayMode === "card" ? "List" : "Grid"}>
                        <IconButton
                            onClick={() =>
                                setDisplayMode(
                                    displayMode === "grid" ? "card" : "grid",
                                )
                            }
                        >
                            {displayMode === "card" && <ListIcon />}
                            {displayMode === "grid" && (
                                <CalendarViewMonthIcon />
                            )}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Organizational structure">
                        <IconButton
                            onClick={() => navigate("structure")}
                            color="info"
                        >
                            <HierarchyIcon />
                        </IconButton>
                    </Tooltip>

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

                    {hasAccessByRoles(
                        ["super_hr", "hr", "recruiter"],
                        roles,
                    ) && (
                        <Button
                            onClick={() => navigate("add")}
                            startIcon={<PersonAddIcon />}
                            variant="outlined"
                            size="small"
                            color="success"
                        >
                            Add person
                        </Button>
                    )}
                </Box>
            </Box>

            <EmployeeListFilter
                showFilter={showFilter}
                listState={listState}
                setListState={setListState}
            />

            <WatchModal
                open={openWatchEmployeeModal}
                onClose={handleCloseWatchEmployeeModal}
                employee={watchingEmployee}
            />

            {displayMode === "grid" && (
                <>
                    <DataGridPro
                        sx={{
                            "& .MuiDataGrid-row": {
                                cursor: "pointer",
                            },
                        }}
                        columns={columns}
                        rows={data?.payload?.items || []}
                        slots={{
                            toolbar: CustomGridToolbar,
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
                            columns: {
                                columnVisibilityModel: {
                                    grade: false,
                                    created: false,
                                    work_started: hasAccessByRoles(
                                        ["hr", "super_hr", "finance"],
                                        roles,
                                    ),
                                    work_ended: hasAccessByRoles(
                                        ["hr", "super_hr", "finance"],
                                        roles,
                                    ),
                                    pool: false,
                                },
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
                        newTabPath="/people/view"
                        contextMenuEvent={contextMenuEvent}
                        contextMenuEventCurrentTarget={
                            contextMenuEventCurrentTarget
                        }
                        onClose={handleCloseContextMenu}
                    />
                </>
            )}

            {displayMode === "card" && (
                <EmployeeCardList employees={data?.payload?.items || []} />
            )}

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
