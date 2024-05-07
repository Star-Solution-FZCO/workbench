import RestoreIcon from "@mui/icons-material/Restore";
import {
    Box,
    IconButton,
    MenuItem,
    Pagination,
    Select,
    SelectChangeEvent,
    Tooltip,
} from "@mui/material";
import { DataGridPro, GridColDef, GridSortModel } from "@mui/x-data-grid-pro";
import { Employee, ListStateT, SearchField } from "_components";
import { policiesApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { debounce } from "lodash";
import { FC, useCallback, useMemo, useState } from "react";
import { UserInfoT } from "types";
import { calculatePageCount } from "utils";
import { formatDateHumanReadable } from "utils/convert";
import {
    ActionTypeT,
    ExcludedFilterT,
    NestedModalTypeT,
    SelectedEmployeeT,
    initialListState,
    transformFilterValue,
} from "./utils";

interface IExclusionListProps {
    policy_id: number;
    setActionType: React.Dispatch<React.SetStateAction<ActionTypeT>>;
    setSelectedEmployee: React.Dispatch<
        React.SetStateAction<SelectedEmployeeT>
    >;
    setNestedOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setNestedModalType: React.Dispatch<React.SetStateAction<NestedModalTypeT>>;
}

const ExclusionList: FC<IExclusionListProps> = ({
    policy_id,
    setActionType,
    setSelectedEmployee,
    setNestedOpen,
    setNestedModalType,
}) => {
    const profile = useAppSelector((state) => state.profile.payload);

    const [excludedFilter, setExcludedFilter] =
        useState<ExcludedFilterT>("excluded");
    const [exclusionsListState, setExclusionsListState] = useState<ListStateT>({
        ...initialListState,
        sort_by: [
            { columnKey: "excluded", direction: "DESC" },
            { columnKey: "english_name", direction: "ASC" },
        ],
    });
    const [exclusionsPage, setExclusionsPage] = useState(1);

    const {
        data: exclusions,
        isLoading: exclusionsLoading,
        isFetching: exclusionsFetching,
    } = policiesApi.useListPolicyExclusionQuery({
        policy_id,
        excluded: transformFilterValue(excludedFilter),
        ...makeListParams(exclusionsListState, ["english_name___icontains"]),
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

    const excludedColumns = useMemo<
        GridColDef<UserInfoT & { excluded: string | null }>[]
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
                        <Tooltip title="Restore">
                            <IconButton
                                onClick={(e) =>
                                    handleClickAction(e, "restore", row)
                                }
                                sx={{ p: 0 }}
                                size="small"
                                color="success"
                                disabled={!profile.admin || !row.excluded}
                            >
                                <RestoreIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ),
            },
            {
                field: "english_name",
                headerName: "Employee",
                flex: 1,
                renderCell: ({ row }) => <Employee employee={row} />,
            },
            {
                field: "excluded",
                headerName: "Excluded",
                filterable: false,
                flex: 1,
                renderCell: ({ row }) =>
                    row.excluded && formatDateHumanReadable(row.excluded),
            },
        ],
        [profile.admin],
    );

    const handleListStateChange = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (name: keyof ListStateT) => (value: any) => {
            setExclusionsListState({
                ...exclusionsListState,
                [name]: value,
            });
        },
        [exclusionsListState],
    );

    const search = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        if (event.target.value.length === 0) {
            setExclusionsPage(1);
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
        setExclusionsPage(page);
        handleListStateChange("offset")(initialListState.limit * (page - 1));
    };

    const exclusionsCount = calculatePageCount(
        initialListState.limit,
        exclusions?.payload?.count,
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
                    value={excludedFilter}
                    onChange={(event: SelectChangeEvent) => {
                        setExcludedFilter(
                            event.target.value as ExcludedFilterT,
                        );
                    }}
                    size="small"
                >
                    <MenuItem value="excluded">Excluded</MenuItem>
                    <MenuItem value="not_excluded">Not excluded</MenuItem>
                </Select>
            </Box>

            <DataGridPro
                columns={excludedColumns}
                rows={exclusions?.payload?.items || []}
                loading={exclusionsLoading || exclusionsFetching}
                initialState={{
                    sorting: {
                        sortModel: [
                            {
                                field: "excluded",
                                sort: "desc",
                            },
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

            {exclusionsCount > 1 && (
                <Pagination
                    page={exclusionsPage}
                    count={exclusionsCount}
                    onChange={(_, page) => handleChangePagination(page)}
                />
            )}
        </Box>
    );
};

export default ExclusionList;
