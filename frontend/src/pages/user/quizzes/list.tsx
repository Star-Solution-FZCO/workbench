import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import PollIcon from "@mui/icons-material/Poll";
import { Box, Button, Pagination, Typography } from "@mui/material";
import {
    DataGrid,
    GridColDef,
    GridEventListener,
    GridSortModel,
    GridToolbar,
} from "@mui/x-data-grid";
import { ListStateT, SearchField, initialListState } from "_components";
import { policiesApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { formatInTimeZone } from "date-fns-tz";
import { debounce } from "lodash";
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QuizT } from "types";
import { calculatePageCount } from "utils";
import { CreateQuiz } from "./components";

const QuizList = () => {
    const isAdmin = useAppSelector((state) => state.profile.payload.admin);
    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "GMT";

    const navigate = useNavigate();

    const [listState, setListState] = useState<ListStateT>(initialListState);
    const [page, setPage] = useState(1);

    const { data, isLoading, isFetching } = policiesApi.useListQuizQuery(
        makeListParams(listState, ["name___icontains"]),
    );

    const adminColumns: GridColDef<QuizT>[] = [
        {
            sortable: false,
            field: "questions",
            headerName: "Questions",
            valueGetter: (_, row) => row.questions.length,
        },
        {
            field: "pass_percent",
            headerName: "Pass percent",
            renderCell: ({ row }) => row.pass_percent + "%",
        },
        {
            field: "hard_confirm",
            headerName: "Hard confirm",
            type: "boolean",
        },
        {
            field: "is_active",
            headerName: "Active",
            type: "boolean",
        },
        {
            field: "created",
            headerName: "Created",
            renderCell: ({ row }) =>
                formatInTimeZone(
                    row.created + "+00:00",
                    timezone,
                    "dd MMM yyyy HH:mm (OOOO)",
                ),
            flex: 1,
        },
        {
            field: "updated",
            headerName: "Updated",
            renderCell: ({ row }) =>
                formatInTimeZone(
                    row.updated + "+00:00",
                    timezone,
                    "dd MMM yyyy HH:mm (OOOO)",
                ),
            flex: 1,
        },
    ];

    const columns: GridColDef<QuizT>[] = [
        {
            field: "actions",
            width: 80,
            headerName: "",
            renderCell: ({ row }) => (
                <PlayCircleIcon
                    onClick={(e) => {
                        e.stopPropagation();
                        const confirmed = confirm(
                            "Are you sure you want to take the quiz?",
                        );
                        if (!confirmed) return;
                        navigate(`/quizzes/${row.id}/take`);
                    }}
                    color="warning"
                />
            ),
            sortable: false,
            resizable: false,
            disableColumnMenu: true,
            disableExport: true,
            disableReorder: true,
        },
        {
            field: "name",
            headerName: "Name",
            flex: 1,
        },
        ...(isAdmin ? adminColumns : []),
    ];

    const handleRowClick: GridEventListener<"rowClick"> = (params) => {
        if (!isAdmin) return;
        navigate(`${params.row.id}/view`);
    };

    const handleListStateChange = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (name: keyof ListStateT) => (value: any) =>
            setListState({
                ...listState,
                [name]: value,
            }),
        [listState],
    );

    const search = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleListStateChange("search")(event.target.value);
    };

    const handleChangeSearch = useCallback(debounce(search, 300), []);

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
                <Box flex={1}>
                    <SearchField onChange={handleChangeSearch} />
                </Box>

                {isAdmin && (
                    <>
                        <CreateQuiz />

                        <Button
                            onClick={() => navigate("results")}
                            variant="outlined"
                            size="small"
                            color="info"
                            startIcon={<PollIcon />}
                        >
                            Results
                        </Button>
                    </>
                )}

                <Button
                    onClick={() => navigate("/quizzes/my-results")}
                    variant="outlined"
                    size="small"
                    color="info"
                    startIcon={<PollIcon />}
                >
                    My quiz results
                </Button>
            </Box>

            <DataGrid
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
                onRowClick={handleRowClick}
                sortingMode="server"
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

export default QuizList;
