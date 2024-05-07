import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    Button,
    FormControlLabel,
    Pagination,
    Switch,
    Typography,
} from "@mui/material";
import {
    DataGrid,
    GridColDef,
    GridEventListener,
    GridSortModel,
    GridToolbar,
} from "@mui/x-data-grid";
import {
    EditButton,
    ListStateT,
    Modal,
    SearchField,
    initialListState,
    isFilterSet,
} from "_components";
import { makeListParams } from "_redux/utils/helpers";
import { debounce, omit } from "lodash";
import React, { FC, useCallback, useMemo, useState } from "react";
import { calculatePageCount } from "utils";
import {
    ArchiveRestoreButton,
    ArchiveRestoreForm,
    SetDefaultButton,
    SetDefaultForm,
} from ".";

interface ICatalogListViewProps {
    entityName: string;
    dataQueryFn: any;
    getEntityQueryFn: any;
    archiveMutation?: any;
    restoreMutation?: any;
    columns: GridColDef<any>[];
    createForm: (onClose: () => void) => any;
    editForm: (onClose: () => void, id: number) => any;
    onRowClick?: GridEventListener<"rowClick">;
    archivable?: boolean;
    hasDefault?: boolean;
    setDefaultMutation?: any;
    disableEdit?: boolean;
}

const CatalogListView: FC<ICatalogListViewProps> = ({
    entityName,
    dataQueryFn,
    getEntityQueryFn,
    archiveMutation,
    restoreMutation,
    columns: columnsFromProps,
    createForm,
    editForm,
    onRowClick,
    archivable,
    hasDefault,
    setDefaultMutation,
    disableEdit,
}) => {
    const [listState, setListState] = useState<ListStateT>({
        ...initialListState,
        filter: archivable
            ? {
                  archived: `is_archived:false`,
              }
            : {},
    });
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [entityId, setEntityId] = useState<number | null>(null);
    const [dialogType, setDialogType] = useState<
        "create" | "edit" | "archive_restore" | "set_default" | null
    >(null);

    const { data, isLoading, isFetching } = dataQueryFn(
        makeListParams(listState, ["name___icontains"]),
    );

    const openDialog = (
        dialogType: "create" | "edit" | "archive_restore" | "set_default",
        organizationId?: number,
    ) => {
        setEntityId(organizationId || null);
        setDialogType(dialogType);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setDialogType(null);
        setEntityId(null);
    };

    const columns = useMemo(() => {
        const _columns: GridColDef<any>[] = [...columnsFromProps];

        if (!disableEdit) {
            _columns.unshift({
                field: "id",
                headerName: "Actions",
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                renderCell: ({ row }) => (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        gap="4px"
                        width="100%"
                    >
                        <EditButton
                            onClick={(e) => {
                                e.stopPropagation();
                                openDialog("edit", row.id);
                            }}
                        />

                        {hasDefault && (
                            <SetDefaultButton
                                row={row}
                                onClick={() => {
                                    openDialog("set_default", row.id);
                                }}
                            />
                        )}

                        {archivable && (
                            <ArchiveRestoreButton
                                row={row}
                                onClick={() =>
                                    openDialog("archive_restore", row.id)
                                }
                            />
                        )}
                    </Box>
                ),
            });
        }
        return _columns;
    }, [archivable, columnsFromProps, disableEdit, hasDefault]);

    const handleListStateChange = useCallback(
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

    const handleFilterArchived = () => {
        const newFilter = isFilterSet("archived", listState)
            ? omit(listState.filter, "archived")
            : {
                  ...listState.filter,
                  archived: "is_archived:false",
              };

        handleListStateChange("filter")(newFilter);
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
            <Modal open={modalOpen} onClose={handleCloseModal}>
                {dialogType === "create" && createForm(handleCloseModal)}
                {dialogType === "edit" &&
                    entityId &&
                    editForm(handleCloseModal, entityId)}
                {dialogType === "archive_restore" && entityId && (
                    <ArchiveRestoreForm
                        id={entityId}
                        onClose={handleCloseModal}
                        entityName={entityName}
                        getEntityQuery={getEntityQueryFn}
                        useArchiveMutation={archiveMutation}
                        useRestoreMutation={restoreMutation}
                    />
                )}
                {dialogType === "set_default" && entityId && (
                    <SetDefaultForm
                        id={entityId}
                        entityName={entityName}
                        useSetDefaultMutation={setDefaultMutation}
                        onClose={handleCloseModal}
                    />
                )}
            </Modal>

            <Box display="flex" gap={1}>
                <Box flex={1}>
                    <SearchField onChange={handleChangeSearch} />
                </Box>

                {!disableEdit && (
                    <Button
                        color="secondary"
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => openDialog("create")}
                    >
                        Add {entityName.toLowerCase()}
                    </Button>
                )}

                {archivable && (
                    <FormControlLabel
                        sx={{ ml: 0.1 }}
                        label="Show archived"
                        control={<Switch size="small" />}
                        checked={!isFilterSet("archived", listState)}
                        onChange={handleFilterArchived}
                    />
                )}
            </Box>

            <DataGrid
                sx={{
                    ...(onRowClick && {
                        "& .MuiDataGrid-row": {
                            cursor: "pointer",
                        },
                    }),
                }}
                columns={columns}
                rows={data?.payload?.items || []}
                loading={isLoading || isFetching}
                slots={{
                    toolbar: GridToolbar,
                }}
                onSortModelChange={handleSortModelChange}
                onRowClick={onRowClick}
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

export { CatalogListView };
