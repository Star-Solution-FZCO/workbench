import {
    Box,
    Button,
    FormControlLabel,
    Pagination,
    Switch,
    Tooltip,
    Typography,
    debounce,
} from "@mui/material";
import {
    DataGridPro,
    GridColDef,
    GridRowSelectionModel,
    GridSortModel,
} from "@mui/x-data-grid-pro";
import { DatePicker } from "@mui/x-date-pickers-pro";
import {
    Employee,
    ListStateT,
    SearchField,
    Title,
    initialListState,
    isFilterSet,
} from "_components";
import { DateShortcuts } from "_components/reports/date_shortcuts";
import { employeesApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { format } from "date-fns";
import { omit } from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createSearchParams, useNavigate } from "react-router-dom";
import { TeamT } from "types";

const TeamReports = () => {
    const navigate = useNavigate();

    const [page, setPage] = useState(1);
    const [listState, setListState] = useState<ListStateT>({
        ...initialListState,
        filter: { archived: "is_archived:false" },
        limit: 50,
    });
    const [rowSelectionModel, setRowSelectionModel] =
        useState<GridRowSelectionModel>([]);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const { data, isLoading, isFetching } = employeesApi.useListTeamQuery(
        makeListParams(listState, ["name___icontains", "key___icontains"]),
    );

    const columns = useMemo<GridColDef<TeamT>[]>(
        () => [
            { field: "name", headerName: "Name", flex: 1 },
            {
                field: "manager",
                headerName: "Team Lead",
                flex: 1,
                valueGetter: (_, row) => row.manager?.value,
                renderCell: ({ row }) =>
                    row.manager ? (
                        <Employee
                            employee={{
                                id: row.manager.value as number,
                                english_name: row.manager.label,
                                pararam: row.manager.label,
                            }}
                        />
                    ) : (
                        <Typography> --- </Typography>
                    ),
            },
        ],
        [],
    );

    const handleRowSelectionModelChange = (
        newRowSelectionModel: GridRowSelectionModel,
    ) => {
        setRowSelectionModel(newRowSelectionModel);
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

    const handleFilterArchived = () => {
        const newFilter = isFilterSet("archived", listState)
            ? omit(listState.filter, "archived")
            : {
                  ...listState.filter,
                  archived: "is_archived:false",
              };

        handleListStateChange("filter")(newFilter);
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

    const handleChangeSearch = useCallback(debounce(search, 300), []);

    const handleSortModelChange = (sortModel: GridSortModel) => {
        handleListStateChange("sort_by")(
            sortModel.map((item) => ({
                columnKey: item.field,
                direction: item.sort?.toUpperCase(),
            })),
        );
    };

    const setRange = (start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
    };

    const generateReport = useCallback(() => {
        if (!startDate || !endDate) return;

        const params = {
            ...(rowSelectionModel.length > 0 && {
                id: rowSelectionModel.join(","),
            }),
            start: format(startDate, "yyyy-MM-dd"),
            end: format(endDate, "yyyy-MM-dd"),
        };

        const pathname = "members";

        navigate({
            pathname,
            search: createSearchParams(params).toString(),
        });
    }, [navigate, startDate, endDate, rowSelectionModel]);

    const buttonsDisabled = !startDate || !endDate;

    const count = data?.payload?.count
        ? Math.ceil(data?.payload?.count / listState.limit)
        : 0;

    useEffect(() => {
        const keyDownHandler = (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                event.preventDefault();

                if (!buttonsDisabled) {
                    generateReport();
                }
            }
        };

        document.addEventListener("keydown", keyDownHandler);

        return () => {
            document.removeEventListener("keydown", keyDownHandler);
        };
    }, [buttonsDisabled, generateReport]);

    return (
        <Box display="flex" flexDirection="column" height="100%" gap={1}>
            <Title title="Team Reports" />

            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Box flex={1}>
                    <SearchField onChange={handleChangeSearch} />
                </Box>

                <FormControlLabel
                    sx={{ ml: 0.1 }}
                    label="Show archived"
                    control={<Switch size="small" />}
                    checked={!isFilterSet("archived", listState)}
                    onChange={handleFilterArchived}
                />
            </Box>

            <Box display="flex" gap={1}>
                <DatePicker
                    value={startDate}
                    onChange={(value: Date | null) => setStartDate(value)}
                    slotProps={{
                        textField: {
                            size: "small",
                            sx: { width: "180px" },
                        },
                    }}
                />

                <DatePicker
                    value={endDate}
                    onChange={(value: Date | null) => setEndDate(value)}
                    slotProps={{
                        textField: {
                            size: "small",
                            sx: { width: "180px" },
                        },
                    }}
                />

                <Tooltip
                    title='You can also generate a report by pressing the "Enter"'
                    placement="top"
                >
                    <Button
                        onClick={generateReport}
                        variant="outlined"
                        size="small"
                        disabled={buttonsDisabled}
                    >
                        Generate
                    </Button>
                </Tooltip>
            </Box>

            <DateShortcuts setRange={setRange} />

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

export default TeamReports;
