import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { TabContext, TabList } from "@mui/lab";
import {
    Box,
    Checkbox,
    Pagination,
    Tab,
    Tooltip,
    Typography,
} from "@mui/material";
import { GridColDef, GridEventListener, GridSortModel } from "@mui/x-data-grid";
import { DataGridPro } from "@mui/x-data-grid-pro";
import {
    Employee,
    EmployeeDoneTaskScore,
    ListStateT,
    initialListState,
} from "_components";
import DayTypeIconButton from "_components/day_type_icon";
import WatchModal from "_components/watch_modal";
import { employeesApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { FC, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmployeeT } from "types";
import { calculatePageCount } from "utils";

const createParams = (id: number, filter: string): ListStateT => ({
    ...initialListState,
    sort_by: [{ columnKey: "english_name", direction: "ASC" }],
    filter: {
        [filter]: `${filter}:${id}`,
    },
});

const initialSortModal: GridSortModel = [
    {
        field: "english_name",
        sort: "asc",
    },
];

interface ITotalResultsProps {
    count?: number;
}

const TotalResults: FC<ITotalResultsProps> = ({ count }) => {
    return count ? (
        <Typography fontSize={14}>Total results: {count}</Typography>
    ) : null;
};

interface IWatchedAndSubordinatesProps {
    id: number;
}

const WatchedAndSubordinates: FC<IWatchedAndSubordinatesProps> = ({ id }) => {
    const navigate = useNavigate();

    const [currentTab, setCurrentTab] = useState<"watched" | "subordinates">(
        "watched",
    );

    const [watchedPage, setWatchedPage] = useState(1);
    const [watchedListState, setWatchedListState] = useState(
        createParams(id, "watchers"),
    );
    const [subordinatesPage, setSubordinatesPage] = useState(1);
    const [subordinatesListState, setSubordinatesListState] = useState(
        createParams(id, "managers"),
    );

    const [watchedSortModel, setWatchedSortModel] =
        useState<GridSortModel>(initialSortModal);
    const [subordinatesSortModel, setSubordinatesSortModel] =
        useState<GridSortModel>(initialSortModal);

    const [openWatchEmployeeModal, setOpenWatchEmployeeModal] =
        useState<boolean>(false);
    const [watchingEmployee, setWatchingEmployee] = useState<EmployeeT | null>(
        null,
    );

    const {
        data: watched,
        isLoading: watchedLoading,
        isFetching: watchedFetching,
    } = employeesApi.useListEmployeeQuery(makeListParams(watchedListState, []));

    const {
        data: subordinates,
        isLoading: subordinatesLoading,
        isFetching: subordinatesFetching,
    } = employeesApi.useListEmployeeQuery(
        makeListParams(subordinatesListState, []),
    );

    const isWatchedTab = currentTab === "watched";
    const loading =
        watchedLoading ||
        watchedFetching ||
        subordinatesLoading ||
        subordinatesFetching;

    const columns = useMemo<GridColDef<EmployeeT>[]>(() => {
        const columns: GridColDef<EmployeeT>[] = [
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
                        gap={1}
                    >
                        <EmployeeDoneTaskScore score={row.done_task_score} />
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
                flex: 1,
                renderCell: ({ row }) => row.position?.label,
            },
        ];

        if (isWatchedTab) {
            columns.unshift({
                field: "",
                sortable: false,
                resizable: false,
                filterable: false,
                width: 50,
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
                                sx={{ padding: 0, color: "#757575" }}
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
            });
        }

        return columns;
    }, [isWatchedTab]);

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

    const handleRowClick: GridEventListener<"rowClick"> = (params) => {
        navigate(`/people/view/${params.row.id}`);
    };

    const handleListStateChange = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (name: keyof ListStateT) => (value: any) => {
            const setListState = isWatchedTab
                ? setWatchedListState
                : setSubordinatesListState;

            const listState = isWatchedTab
                ? watchedListState
                : subordinatesListState;

            setListState({
                ...listState,
                offset: name !== "search" ? initialListState.offset : 0,
                [name]: value,
            });
        },
        [isWatchedTab, watchedListState, subordinatesListState],
    );

    const handleChangePagination = (
        _: React.ChangeEvent<unknown>,
        page: number,
    ) => {
        if (isWatchedTab) {
            setWatchedPage(page);
        } else {
            setSubordinatesPage(page);
        }

        handleListStateChange("offset")(initialListState.limit * (page - 1));
    };

    const handleSortModelChange = (sortModel: GridSortModel) => {
        if (isWatchedTab) {
            setWatchedSortModel(sortModel);
        } else {
            setSubordinatesSortModel(sortModel);
        }
        handleListStateChange("sort_by")(
            sortModel.map((item) => ({
                columnKey: item.field,
                direction: item.sort?.toUpperCase(),
            })),
        );
    };

    const count = calculatePageCount(
        initialListState.limit,
        isWatchedTab ? watched?.payload?.count : subordinates?.payload?.count,
    );

    return (
        <Box display="flex" flexDirection="column" height="100%">
            <WatchModal
                open={openWatchEmployeeModal}
                onClose={handleCloseWatchEmployeeModal}
                employee={watchingEmployee}
            />

            <TabContext value={currentTab}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <TabList onChange={(_, value) => setCurrentTab(value)}>
                        <Tab label="Watched" value="watched" />
                        <Tab label="Subordinates" value="subordinates" />
                    </TabList>
                </Box>

                <DataGridPro
                    sx={{
                        "& .MuiDataGrid-row": {
                            cursor: "pointer",
                        },
                    }}
                    columns={columns}
                    rows={
                        (isWatchedTab
                            ? watched?.payload?.items
                            : subordinates?.payload?.items) || []
                    }
                    onCellClick={handleRowClick}
                    sortModel={
                        isWatchedTab ? watchedSortModel : subordinatesSortModel
                    }
                    onSortModelChange={handleSortModelChange}
                    loading={loading}
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
                            page={isWatchedTab ? watchedPage : subordinatesPage}
                            count={count}
                            onChange={handleChangePagination}
                        />
                    )}

                    <TotalResults
                        count={
                            isWatchedTab
                                ? watched?.payload?.count
                                : subordinates?.payload?.count
                        }
                    />
                </Box>
            </TabContext>
        </Box>
    );
};

export default WatchedAndSubordinates;
