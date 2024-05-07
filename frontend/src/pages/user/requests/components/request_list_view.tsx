/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Box,
    FormControlLabel,
    Pagination,
    Switch,
    Typography,
    debounce,
} from "@mui/material";
import {
    DataGrid,
    GridColDef,
    GridEventListener,
    GridSortModel,
    GridToolbar,
} from "@mui/x-data-grid";
import {
    ListStateT,
    SearchField,
    isFilterSet,
    switchFilterDisabled,
} from "_components";
import { makeListParams } from "_redux/utils/helpers";

import React, { FC, useCallback, useState } from "react";

import { calculatePageCount } from "utils";
import { EmployeeRequestSettings } from "./employee_request_settings";

interface RequestListViewProps {
    initialParams: ListStateT;
    queryFn: any;
    columns: GridColDef<any>[];
    onRowClick?: GridEventListener<"rowClick">;
    datagridProps?: any;
    request_type?: "JOIN_TEAM" | "ADD_EMPLOYEE" | "DISMISS_EMPLOYEE";
    search_fields?: string[];
    hideSearch?: boolean;
}

const RequestListView: FC<RequestListViewProps> = ({
    initialParams,
    queryFn,
    columns,
    onRowClick,
    datagridProps,
    request_type,
    search_fields,
    hideSearch,
}) => {
    const [page, setPage] = useState(1);
    const [listState, setListState] = useState<ListStateT>(initialParams);

    const { data, isLoading, isFetching } = queryFn(
        makeListParams(listState, search_fields || []),
    );

    const handleListStateChange = useCallback(
        (name: keyof ListStateT) => (value: any) => {
            setListState({
                ...listState,
                [name]: value,
            });
        },
        [listState],
    );

    const search = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleListStateChange("search")(event.target.value);
    };

    const handleChangeSearch = useCallback(debounce(search, 300), [listState]);

    const handleChangePagination = (
        _: React.ChangeEvent<unknown>,
        page: number,
    ) => {
        setPage(page);
        handleListStateChange("offset")(listState.limit * (page - 1));
    };

    const handleSortModelChange = (sortModel: GridSortModel) => {
        handleListStateChange("sort_by")(
            sortModel.map((item) => ({
                columnKey: item.field,
                direction: item.sort?.toUpperCase(),
            })),
        );
    };

    const count = calculatePageCount(listState.limit, data?.payload?.count);

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box display="flex" gap={1}>
                {!hideSearch && (
                    <Box flex={1}>
                        <SearchField onChange={handleChangeSearch} />
                    </Box>
                )}

                <FormControlLabel
                    sx={{ ml: 0.1 }}
                    control={<Switch size="small" />}
                    checked={!isFilterSet("status", listState)}
                    label="Show all"
                    onChange={switchFilterDisabled(
                        "status",
                        "status:NEW",
                        listState,
                        setListState,
                    )}
                />

                {request_type &&
                    ["ADD_EMPLOYEE", "DISMISS_EMPLOYEE"].includes(
                        request_type,
                    ) && <EmployeeRequestSettings />}
            </Box>

            <DataGrid
                {...datagridProps}
                sx={{
                    "& .MuiDataGrid-row": {
                        cursor: "pointer",
                    },
                }}
                columns={columns}
                rows={data?.payload?.items || []}
                loading={isLoading || isFetching}
                slots={{
                    toolbar: GridToolbar,
                }}
                onSortModelChange={handleSortModelChange}
                sortingMode="server"
                onRowClick={onRowClick}
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

                {data?.payload?.count ? (
                    <Typography fontSize={14}>
                        Total results: {data.payload.count}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    );
};

export { RequestListView };
