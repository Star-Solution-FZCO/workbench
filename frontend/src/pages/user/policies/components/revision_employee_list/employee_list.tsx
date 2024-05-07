import NotificationAddIcon from "@mui/icons-material/NotificationAdd";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import {
    Box,
    Button,
    IconButton,
    MenuItem,
    Pagination,
    Select,
    SelectChangeEvent,
    Tooltip,
    debounce,
} from "@mui/material";
import { DataGridPro, GridColDef, GridSortModel } from "@mui/x-data-grid-pro";
import { Employee, ListStateT, SearchField } from "_components";
import { policiesApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { FC, useCallback, useMemo, useState } from "react";
import { UserInfoT } from "types";
import { calculatePageCount } from "utils";
import { formatDateHumanReadable } from "utils/convert";
import {
    ActionTypeT,
    ApprovedFilterT,
    NestedModalTypeT,
    SelectedEmployeeT,
    initialListState,
    transformFilterValue,
} from "./utils";

interface IEmployeeListProps {
    policy_id: number;
    revision_id: number;
    setActionType: React.Dispatch<React.SetStateAction<ActionTypeT>>;
    setSelectedEmployee: React.Dispatch<
        React.SetStateAction<SelectedEmployeeT>
    >;
    setNestedOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setNestedModalType: React.Dispatch<React.SetStateAction<NestedModalTypeT>>;
}

const EmployeeList: FC<IEmployeeListProps> = ({
    policy_id,
    revision_id,
    setActionType,
    setSelectedEmployee,
    setNestedOpen,
    setNestedModalType,
}) => {
    const profile = useAppSelector((state) => state.profile.payload);

    const [approvedFilter, setApprovedFilter] =
        useState<ApprovedFilterT>("all");
    const [employeesListState, setEmployeesListState] = useState<ListStateT>({
        ...initialListState,
        sort_by: [
            { columnKey: "approved", direction: "DESC" },
            { columnKey: "english_name", direction: "ASC" },
        ],
    });
    const [employeesPage, setEmployeesPage] = useState(1);

    const {
        data: employees,
        isLoading: employeesLoading,
        isFetching: employeesFetching,
    } = policiesApi.useGetPolicyRevisionEmployeeListQuery({
        policy_id,
        revision_id,
        approved: transformFilterValue(approvedFilter),
        ...makeListParams(employeesListState, ["english_name___icontains"]),
    });

    const handleClickAction = (
        event: React.MouseEvent<HTMLButtonElement>,
        actionType: ActionTypeT,
        employee: SelectedEmployeeT,
    ) => {
        event.stopPropagation();
        setActionType(actionType);
        setSelectedEmployee(employee);
        setNestedModalType("exclusion");
        setNestedOpen(true);
    };

    const aprrovedColumns = useMemo<
        GridColDef<UserInfoT & { approved: string | null }>[]
    >(
        () => [
            {
                field: "id",
                headerName: "Actions",
                width: 70,
                resizable: false,
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                disableReorder: true,
                renderCell: ({ row }) => (
                    <Box
                        width="100%"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Tooltip title="Exclude">
                            <IconButton
                                onClick={(e) =>
                                    handleClickAction(e, "exclude", row)
                                }
                                sx={{ p: 0 }}
                                size="small"
                                color="error"
                                disabled={!profile.admin}
                            >
                                <RemoveCircleIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ),
            },
            {
                field: "english_name",
                headerName: "Person",
                flex: 1,
                renderCell: ({ row }) => <Employee employee={row} />,
            },
            {
                field: "approved",
                headerName: "Approved",
                sortable: false,
                filterable: false,
                flex: 1,
                renderCell: ({ row }) =>
                    row.approved && formatDateHumanReadable(row.approved),
            },
        ],
        [profile.admin],
    );

    const handleClickNotifyButton = () => {
        setNestedModalType("notification");
        setNestedOpen(true);
    };

    const handleListStateChange = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (name: keyof ListStateT) => (value: any) => {
            setEmployeesListState({
                ...employeesListState,
                [name]: value,
            });
        },
        [employeesListState],
    );

    const search = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        if (event.target.value.length === 0) {
            setEmployeesPage(1);
        }
        handleListStateChange("search")(event.target.value);
    };

    const handleChangeSearch = useCallback(debounce(search, 300), []);

    const handleSortModelChange = (sortModel: GridSortModel) => {
        handleListStateChange("sort_by")(
            sortModel.map((item) => ({
                columnKey: item.field,
                direction: item.sort?.toUpperCase(),
            })),
        );
    };

    const handleChangePagination = (page: number) => {
        setEmployeesPage(page);
        handleListStateChange("offset")(initialListState.limit * (page - 1));
    };

    const employeesCount = calculatePageCount(
        initialListState.limit,
        employees?.payload?.count,
    );

    return (
        <Box
            display="flex"
            flexDirection="column"
            height="calc(100% - 104px)"
            gap={1}
        >
            <Box display="flex" alignItems="center" gap={1}>
                <Box flex={1}>
                    <SearchField onChange={handleChangeSearch} />
                </Box>

                <Select
                    value={approvedFilter}
                    onChange={(event: SelectChangeEvent) => {
                        setApprovedFilter(
                            event.target.value as ApprovedFilterT,
                        );
                    }}
                    size="small"
                >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="not_approved">Not approved</MenuItem>
                </Select>

                {profile.admin && (
                    <Tooltip title="Notify unapproved people" placement="top">
                        <Button
                            onClick={handleClickNotifyButton}
                            size="small"
                            variant="outlined"
                            color="warning"
                        >
                            <NotificationAddIcon />
                        </Button>
                    </Tooltip>
                )}
            </Box>

            <DataGridPro
                columns={aprrovedColumns}
                rows={employees?.payload?.items || []}
                loading={employeesLoading || employeesFetching}
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
                onSortModelChange={handleSortModelChange}
                density="compact"
                sortingMode="server"
                hideFooter
            />

            {employeesCount > 1 && (
                <Pagination
                    page={employeesPage}
                    count={employeesCount}
                    onChange={(_, page) => handleChangePagination(page)}
                />
            )}
        </Box>
    );
};

export default EmployeeList;
