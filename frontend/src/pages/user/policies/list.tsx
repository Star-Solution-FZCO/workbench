import AddIcon from "@mui/icons-material/Add";
import WarningIcon from "@mui/icons-material/Warning";
import {
    Box,
    Button,
    Pagination,
    Tooltip,
    Typography,
    debounce,
} from "@mui/material";
import {
    DataGridPro,
    GridColDef,
    GridEventListener,
    GridSortModel,
    GridToolbar,
} from "@mui/x-data-grid-pro";
import {
    Employee,
    ListStateT,
    SearchField,
    initialListState,
} from "_components";
import { policiesApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { FC, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PolicyT } from "types";
import { calculatePageCount } from "utils";
import { formatDateHumanReadable } from "utils/convert";

interface IQuizButtonProps {
    policy: PolicyT;
}

const QuizButton: FC<IQuizButtonProps> = ({ policy }) => {
    const navigate = useNavigate();
    return (
        <Tooltip title="Take quiz to approve policy" placement="top">
            <WarningIcon
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/quizzes/${policy.quiz?.value}/take`, {
                        state: { policy },
                    });
                }}
                color="warning"
            />
        </Tooltip>
    );
};

const PolicyList: FC = () => {
    const navigate = useNavigate();

    const profile = useAppSelector(({ profile }) => profile.payload);

    const [page, setPage] = useState(1);
    const [listState, setListState] = useState<ListStateT>({
        ...initialListState,
        sort_by: [{ columnKey: "name", direction: "ASC" }],
    });

    const { data, isLoading, isFetching } = policiesApi.useGetPolicyListQuery(
        makeListParams(listState, ["name___icontains"]),
    );

    const columns = useMemo<GridColDef<PolicyT>[]>(
        () => [
            {
                field: "quiz_id",
                headerName: "Quiz",
                width: 60,
                sortable: false,
                resizable: false,
                disableColumnMenu: true,
                disableReorder: true,
                renderCell: ({ row }) =>
                    row.quiz && !row.quiz_passed ? (
                        <QuizButton policy={row} />
                    ) : null,
            },
            { field: "name", headerName: "Name", flex: 1 },
            {
                field: "approved",
                headerName: "Approved",
                flex: 1,
                renderCell: ({ row }) =>
                    row.approved && formatDateHumanReadable(row.approved),
            },
            {
                field: "canceled",
                headerName: "Canceled",
                flex: 1,
                renderCell: ({ row }) =>
                    row.canceled && formatDateHumanReadable(row.canceled),
            },
            {
                field: "canceled_by",
                headerName: "Cancelled by",
                flex: 1,
                renderCell: ({ row }) =>
                    row.canceled_by && <Employee employee={row.canceled_by} />,
                valueGetter: (_, row) =>
                    row.canceled_by ? row.canceled_by.english_name : "",
            },
        ],
        [],
    );

    const handleRowClick: GridEventListener<"rowClick"> = (params) => {
        navigate(`view/${params.row.id}`);
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

    const handleSortModelChange = (sortModel: GridSortModel) => {
        handleListStateChange("sort_by")(
            sortModel.map((item) => ({
                columnKey: item.field,
                direction: item.sort?.toUpperCase(),
            })),
        );
    };

    const handleChangePagination = (
        _: React.ChangeEvent<unknown>,
        page: number,
    ) => {
        setPage(page);
        handleListStateChange("offset")(listState.limit * (page - 1));
    };

    const count = calculatePageCount(listState.limit, data?.payload?.count);

    return (
        <Box display="flex" flexDirection="column" height="100%" gap={1}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Box flex={1}>
                    <SearchField onChange={handleChangeSearch} />
                </Box>

                {profile.admin && (
                    <>
                        <Button
                            onClick={() => navigate("create")}
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                        >
                            Create policy
                        </Button>
                    </>
                )}
            </Box>

            <DataGridPro
                sx={{
                    "& .MuiDataGrid-row": {
                        cursor: "pointer",
                    },
                }}
                slots={{ toolbar: GridToolbar }}
                columns={columns}
                rows={data?.payload.items || []}
                initialState={{
                    sorting: {
                        sortModel: [{ field: "name", sort: "asc" }],
                    },
                    filter: {
                        filterModel: {
                            items: [
                                {
                                    field: "canceled",
                                    operator: "isEmpty",
                                },
                            ],
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

export default PolicyList;
