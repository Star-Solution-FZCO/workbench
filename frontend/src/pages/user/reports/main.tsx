import FilterAltIcon from "@mui/icons-material/FilterAlt";

import {
    Box,
    FormControlLabel,
    IconButton,
    Pagination,
    Typography,
} from "@mui/material";
import {
    DataGridPro,
    GridColDef,
    GridRowSelectionModel,
    GridSortModel,
} from "@mui/x-data-grid-pro";
import { useTour } from "@reactour/tour";
import {
    Employee,
    EmployeeListFilter,
    ListStateT,
    Pointer,
    ReportControls,
    ReportOnboarding,
    SearchField,
    TrainingButton,
    initialListState,
} from "_components";
import { employeesApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { monthAgo, today } from "config";
import { format } from "date-fns";
import { debounce, omit } from "lodash";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
    createSearchParams,
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import { EmployeeT, ReportTypeT, SelectOptionT } from "types";
import { employeeListfilterNames } from "utils/references";
import { generateReportWarningMessage, reportPathMap } from "./utils";

interface IFilterButtonProps {
    onClick: () => void;
}

const FilterButton: FC<IFilterButtonProps> = ({ onClick }) => {
    const { isOpen, currentStep, setCurrentStep } = useTour();

    const handleClick = () => {
        onClick();
        if (isOpen) {
            setCurrentStep(9);
        }
    };

    return (
        <Pointer show={currentStep === 8}>
            <FormControlLabel
                className="reports-filters-button"
                sx={{
                    "@keyframes border-pulsate": {
                        "0%": {
                            border: "2px solid rgb(255, 0, 0, 0)",
                        },
                        "50%": {
                            border: "2px solid rgb(255, 0, 0, 1)",
                        },
                        "100%": {
                            border: "2px solid rgb(255, 0, 0, 0)",
                        },
                    },
                    ...(currentStep === 8 && {
                        border: "2px solid red",
                        borderRadius: "8px",
                        animation: "border-pulsate 3s infinite",
                    }),
                }}
                label="Filters"
                labelPlacement="start"
                control={
                    <IconButton onClick={handleClick}>
                        <FilterAltIcon />
                    </IconButton>
                }
            />
        </Pointer>
    );
};

const ReportsMainPageInner = () => {
    const navigate = useNavigate();
    const { isOpen: tourOpen, currentStep } = useTour();
    const [searchParams] = useSearchParams();

    const profile = useAppSelector(({ profile }) => profile.payload);

    const filterDefaultOpen = employeeListfilterNames.some((name) =>
        searchParams.has(name),
    );

    const [page, setPage] = useState(1);
    const [showFilter, setShowFilter] = useState(filterDefaultOpen);
    const [listState, setListState] = useState<ListStateT>({
        ...initialListState,
        limit: 200,
        filter: { active: "active:true" },
        sort_by: [{ columnKey: "english_name", direction: "ASC" }],
    });

    const [rowSelectionModel, setRowSelectionModel] =
        useState<GridRowSelectionModel>([]);
    const [showOnlySelected, setShowOnlySelected] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(monthAgo);
    const [endDate, setEndDate] = useState<Date | null>(today());
    const [activitySourceList, setActivitySourceList] = useState<
        SelectOptionT[]
    >([]);
    const [reportType, setReportType] = useState<ReportTypeT>(
        "activity-summary-report",
    );
    const [youtrackOnlyResolved, setYoutrackOnlyResolved] = useState(false);

    const { data, isLoading, isFetching } = employeesApi.useListEmployeeQuery(
        makeListParams(listState, [
            "english_name___icontains",
            "native_name___icontains",
            "email___icontains",
        ]),
    );

    const columns = useMemo<GridColDef<EmployeeT>[]>(() => {
        const columns: GridColDef<EmployeeT>[] = [
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
        ];

        if (
            ["super_hr", "hr", "finance", "lawyer"].some((role) =>
                profile.roles?.includes(role),
            )
        ) {
            columns.splice(7, 0, {
                field: "cooperation_type",
                headerName: "Cooperation type",
                sortable: false,
                filterable: false,
                flex: 1,
                renderCell: ({ row }) => row.cooperation_type?.label,
            });
        }

        return columns;
    }, [profile.roles]);

    const removeFilterBySelected = () => {
        setListState({
            ...listState,
            filter: omit(listState.filter, "id"),
        });
    };

    const handleRowSelectionModelChange = (
        newRowSelectionModel: GridRowSelectionModel,
    ) => {
        setRowSelectionModel(newRowSelectionModel);

        if (newRowSelectionModel.length === 0) {
            setShowOnlySelected(false);
            removeFilterBySelected();
        }

        if (showOnlySelected) {
            handleListStateChange("filter")({
                ...listState.filter,
                id: `id___in:${newRowSelectionModel.join(",")}`,
            });
        }
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

    const handleShowOnlySelected = (selected: boolean) => {
        setShowOnlySelected(selected);

        if (selected) {
            handleListStateChange("filter")({
                ...listState.filter,
                id: `id___in:${rowSelectionModel.join(",")}`,
            });
        } else {
            removeFilterBySelected();
        }
    };

    const handleChangeOnlyResolved = useCallback((selected: boolean) => {
        setYoutrackOnlyResolved(selected);
    }, []);

    const generateReport = () => {
        if (!startDate || !endDate) return;

        if (rowSelectionModel.length === 0) {
            const confirmed = confirm(generateReportWarningMessage);
            if (!confirmed) return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any = {
            ...(rowSelectionModel.length > 0 && {
                id: rowSelectionModel.join(","),
            }),
            ...(activitySourceList.length > 0 && {
                source: activitySourceList.map((item) => item.value).join(","),
            }),
            ...(youtrackOnlyResolved && {
                youtrack_only_resolved: true,
            }),
        };

        if (reportType !== "vacation-free-days-report") {
            params["start"] = format(startDate, "yyyy-MM-dd");
            params["end"] = format(endDate, "yyyy-MM-dd");
        }

        const pathname = reportPathMap[reportType];

        navigate({
            pathname,
            search: createSearchParams(params).toString(),
        });
    };

    const count = data?.payload?.count
        ? Math.ceil(data?.payload?.count / listState.limit)
        : 0;

    useEffect(() => {
        if (tourOpen) {
            setShowFilter(currentStep > 8 && currentStep < 11);
        }
    }, [tourOpen, currentStep]);

    return (
        <Box display="flex" flexDirection="column" height="100%" gap={1}>
            <Box display="flex" gap={1}>
                <Box flex={1}>
                    <SearchField
                        className="reports-search-field"
                        onChange={handleChangeSearch}
                    />
                </Box>

                <TrainingButton />
            </Box>

            <Box display="flex" alignItems="flex-start" gap={1}>
                <ReportControls
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    activitySourceList={activitySourceList}
                    setActivitySourceList={setActivitySourceList}
                    reportType={reportType}
                    setReportType={setReportType}
                    idList={rowSelectionModel}
                    onChangeIdList={(idList) => {
                        setRowSelectionModel(idList);
                    }}
                    teamId={null}
                    onlySelected={showOnlySelected}
                    onChangeOnlySelected={handleShowOnlySelected}
                    onlyResolved={youtrackOnlyResolved}
                    onChangeOnlyResolved={handleChangeOnlyResolved}
                    onGenerate={generateReport}
                    main
                />

                <FilterButton onClick={() => setShowFilter(!showFilter)} />
            </Box>

            <EmployeeListFilter
                showFilter={showFilter}
                listState={listState}
                setListState={setListState}
            />

            <DataGridPro
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
                rowSelectionModel={rowSelectionModel}
                onRowSelectionModelChange={handleRowSelectionModelChange}
                onSortModelChange={handleSortModelChange}
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
                <Box display="flex" alignItems="center" gap={1}>
                    {count > 1 && (
                        <Pagination
                            page={page}
                            count={count}
                            onChange={handleChangePagination}
                        />
                    )}

                    {rowSelectionModel.length > 0 && (
                        <Typography fontSize={14}>
                            Selected: {rowSelectionModel.length}
                        </Typography>
                    )}
                </Box>

                {data?.payload?.count && (
                    <Typography fontSize={14}>
                        Total results: {data.payload.count}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

const ReportsMainPage = () => {
    return (
        <ReportOnboarding>
            <ReportsMainPageInner />
        </ReportOnboarding>
    );
};

export default ReportsMainPage;
