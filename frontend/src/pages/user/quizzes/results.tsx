import { Box, Pagination, Typography } from "@mui/material";
import {
    DataGrid,
    GridColDef,
    GridEventListener,
    GridSortModel,
    GridToolbar,
} from "@mui/x-data-grid";
import { Employee, ListStateT, initialListState } from "_components";
import { policiesApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { formatInTimeZone } from "date-fns-tz";
import NotFound from "pages/404";
import React, { FC, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QuizResultT } from "types";
import { calculatePageCount } from "utils";

interface IQuizResultListProps {
    personal?: boolean;
}

const QuizResultList: FC<IQuizResultListProps> = ({ personal }) => {
    const isAdmin = useAppSelector((state) => state.profile.payload.admin);
    const navigate = useNavigate();

    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "GMT";

    const [listState, setListState] = useState<ListStateT>(initialListState);
    const [page, setPage] = useState(1);

    const { data, isLoading, isFetching } = policiesApi.useListQuizResultQuery({
        personal,
        ...makeListParams(listState, []),
    });

    const columns: GridColDef<QuizResultT>[] = [
        {
            field: "employee",
            headerName: "Person",
            renderCell: ({ row }) => <Employee employee={row.employee} />,
            sortable: false,
            flex: 1,
        },
        {
            field: "quiz",
            headerName: "Quiz",
            valueGetter: (_, row) => row.quiz.name,
            sortable: false,
            flex: 1,
        },
        {
            field: "passed",
            headerName: "Passed",
            flex: 1,
            type: "boolean",
        },
        {
            field: "score",
            headerName: "Score",
            flex: 1,
            renderCell: ({ row }) => row.score + "%",
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
            field: "finished",
            headerName: "Finished",
            renderCell: ({ row }) =>
                row.finished
                    ? formatInTimeZone(
                          row.finished + "+00:00",
                          timezone,
                          "dd MMM yyyy HH:mm (OOOO)",
                      )
                    : null,
            flex: 1,
        },
        {
            field: "confirmed",
            headerName: "Confirmed",
            renderCell: ({ row }) =>
                row.confirmed
                    ? formatInTimeZone(
                          row.confirmed + "+00:00",
                          timezone,
                          "dd MMM yyyy HH:mm (OOOO)",
                      )
                    : null,
            flex: 1,
        },
    ];

    const handleRowClick: GridEventListener<"rowClick"> = (params) => {
        navigate(`/quizzes/results/${params.row.id}`);
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

    if (!isAdmin) return <NotFound />;

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Typography fontWeight={700} fontSize={18}>
                Quiz results
            </Typography>

            <DataGrid
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
                initialState={{
                    columns: {
                        columnVisibilityModel: {
                            employee: !personal,
                        },
                    },
                }}
                loading={isLoading || isFetching}
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

export default QuizResultList;
