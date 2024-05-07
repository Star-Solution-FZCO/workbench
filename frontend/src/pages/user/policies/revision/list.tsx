import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DifferenceIcon from "@mui/icons-material/Difference";
import {
    Box,
    Button,
    IconButton,
    LinearProgress,
    Pagination,
    Typography,
} from "@mui/material";
import {
    DataGridPro,
    GridColDef,
    GridEventListener,
    GridRowSelectionModel,
    GridToolbar,
} from "@mui/x-data-grid-pro";
import { Employee, ListStateT, initialListState } from "_components";
import { policiesApi } from "_redux";
import { useCallback, useMemo, useState } from "react";
import { createSearchParams, useNavigate, useParams } from "react-router-dom";
import { PolicyRevisionT } from "types";
import { formatDateHumanReadable } from "utils/convert";

import { makeListParams } from "_redux/utils/helpers";
import { sortBy } from "lodash";
import { calculatePageCount } from "utils";

const RevisionList = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    if (!id) navigate("..");

    const [page, setPage] = useState(1);
    const [listState, setListState] = useState<ListStateT>({
        ...initialListState,
        sort_by: [{ columnKey: "policy_revision", direction: "DESC" }],
    });

    const [rowSelectionModel, setRowSelectionModel] =
        useState<GridRowSelectionModel>([]);

    const { data: policy } = policiesApi.useGetPolicyQuery(Number(id));

    const {
        data: revisions,
        isLoading,
        isFetching,
    } = policiesApi.useListPolicyRevisionQuery(
        {
            policy_id: policy?.payload?.id || -1,
            ...makeListParams(listState, [""]),
        },
        {
            skip: !policy,
        },
    );

    const columns = useMemo<GridColDef<PolicyRevisionT>[]>(
        () => [
            {
                field: "policy_revision",
                headerName: "Revision",
                resizable: false,
            },
            {
                field: "created",
                headerName: "Created",
                flex: 1,
                valueGetter: (_, row) => formatDateHumanReadable(row.created),
            },
            {
                field: "created_by",
                headerName: "Created by",
                flex: 1,
                renderCell: ({ row }) =>
                    row.created_by && <Employee employee={row.created_by} />,
                valueGetter: (_, row) =>
                    row.created_by ? row.created_by.english_name : "",
            },
            {
                field: "updated",
                headerName: "Updated",
                flex: 1,
                valueGetter: (_, row) =>
                    row.updated ? formatDateHumanReadable(row.updated) : null,
            },
            {
                field: "updated_by",
                headerName: "Updated by",
                flex: 1,
                renderCell: ({ row }) =>
                    row.updated_by && <Employee employee={row.updated_by} />,
                valueGetter: (_, row) =>
                    row.updated_by ? row.updated_by.english_name : "",
            },
            {
                field: "published",
                headerName: "Published",
                flex: 1,
                renderCell: ({ row }) =>
                    row.published && formatDateHumanReadable(row.published),
            },
            {
                field: "published_by",
                headerName: "Published by",
                flex: 1,
                renderCell: ({ row }) =>
                    row.published_by && (
                        <Employee employee={row.published_by} />
                    ),
                valueGetter: (_, row) =>
                    row.published_by ? row.published_by.english_name : "",
            },
        ],
        [],
    );

    const handleRowClick: GridEventListener<"rowClick"> = (params) => {
        const path = params.row.published ? "view" : "edit";
        navigate(`${params.row.policy_revision}/${path}`);
    };

    const handleClickCompare = () => {
        if (rowSelectionModel.length !== 2) return;

        const idList = sortBy(rowSelectionModel);

        navigate({
            pathname: `/policies/diff/${id}`,
            search: createSearchParams({
                rev_old: idList[0].toString(),
                rev_new: idList[1].toString(),
            }).toString(),
        });
    };

    const handleRowSelectionModelChange = (
        newRowSelectionModel: GridRowSelectionModel,
    ) => {
        if (newRowSelectionModel.length > 2) return;
        setRowSelectionModel(newRowSelectionModel);
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

    const count = calculatePageCount(
        listState.limit,
        revisions?.payload?.count,
    );

    if (!policy) return <LinearProgress />;

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <IconButton onClick={() => navigate(-1)}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography fontWeight={500} fontSize={20}>
                        {policy.payload?.name}
                    </Typography>
                </Box>

                <Button
                    onClick={handleClickCompare}
                    startIcon={<DifferenceIcon />}
                    variant="outlined"
                    size="small"
                    color="info"
                    disabled={rowSelectionModel.length !== 2}
                >
                    Compare
                </Button>
            </Box>

            <DataGridPro
                sx={{
                    "& .MuiDataGrid-row": {
                        cursor: "pointer",
                    },
                    "& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-columnHeaderTitleContainer":
                        {
                            display: "none",
                        },
                }}
                slots={{ toolbar: GridToolbar }}
                columns={columns}
                rows={revisions?.payload?.items || []}
                initialState={{
                    sorting: {
                        sortModel: [{ field: "policy_revision", sort: "desc" }],
                    },
                }}
                rowSelectionModel={rowSelectionModel}
                getRowId={(row) => row.policy_revision}
                onRowClick={handleRowClick}
                onRowSelectionModelChange={handleRowSelectionModelChange}
                loading={isLoading || isFetching}
                density="compact"
                checkboxSelection
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

                {revisions?.payload?.count ? (
                    <Typography fontSize={14}>
                        Total results: {revisions.payload.count}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    );
};

export default RevisionList;
