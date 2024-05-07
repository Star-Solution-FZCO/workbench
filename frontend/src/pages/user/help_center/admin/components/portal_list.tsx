import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import {
    Box,
    FormControlLabel,
    Pagination,
    Switch,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    DataGridPro,
    GridCellEditStopParams,
    GridCellEditStopReasons,
    GridColDef,
    GridSortModel,
    GridToolbar,
    MuiEvent,
    useGridApiRef,
} from "@mui/x-data-grid-pro";
import {
    DGCellEdit,
    ListStateT,
    SearchField,
    initialListState,
    isFilterSet,
    switchFilterDisabled,
} from "_components";
import { helpCenterApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { debounce, isEmpty, pickBy } from "lodash";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { PortalT } from "types";
import { calculatePageCount, toastError } from "utils";
import { formatDateTimeHumanReadable } from "utils/convert";
import { PortalForm } from "../../components";

const PortalList = () => {
    const [page, setPage] = useState(1);
    const [listState, setListState] = useState<ListStateT>({
        ...initialListState,
        filter: { is_active: "is_active:true" },
    });

    const apiRef = useGridApiRef();

    const [updatePortal] = helpCenterApi.useUpdatePortalMutation();
    const [deletePortal] = helpCenterApi.useDeletePortalMutation();

    const {
        data: portals,
        isLoading,
        isFetching,
    } = helpCenterApi.useListPortalsQuery(
        makeListParams(listState, ["name___icontains"]),
    );

    const handleClickEdit = (id: number, field: string) => {
        apiRef.current.startCellEditMode({ id, field });
    };

    const handleClickDelete = (e: React.MouseEvent, portal: PortalT) => {
        e.preventDefault();

        const confirmed = confirm(
            `Are you sure you want to delete the portal "${portal.name}"?`,
        );

        if (!confirmed) return;

        deletePortal(portal.id)
            .unwrap()
            .then(() => {
                toast.success(
                    `Portal "${portal.name}" was successfully deleted`,
                );
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleClickRestore = (e: React.MouseEvent, portal: PortalT) => {
        e.preventDefault();

        const confirmed = confirm(
            `Are you sure you want to restore the portal "${portal.name}"?`,
        );

        if (!confirmed) return;

        updatePortal({ id: portal.id, is_active: true })
            .unwrap()
            .then(() => {
                toast.success(
                    `Portal "${portal.name}" was successfully restored`,
                );
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const columns: GridColDef<PortalT>[] = [
        {
            field: "",
            headerName: "Actions",
            disableColumnMenu: true,
            resizable: false,
            filterable: false,
            sortable: false,
            renderCell: ({ row }) => (
                <Box display="flex" width="100%" justifyContent="center">
                    <Tooltip
                        title={row.is_active ? "Delete" : "Restore"}
                        placement="top"
                    >
                        {row.is_active ? (
                            <DeleteIcon
                                sx={(theme) => ({
                                    color: theme.palette.error.main,
                                    cursor: "pointer",
                                })}
                                onClick={(e) => handleClickDelete(e, row)}
                                fontSize="small"
                            />
                        ) : (
                            <RestoreIcon
                                sx={(theme) => ({
                                    color: theme.palette.success.main,
                                    cursor: "pointer",
                                })}
                                onClick={(e) => handleClickRestore(e, row)}
                                fontSize="small"
                            />
                        )}
                    </Tooltip>
                </Box>
            ),
        },
        {
            field: "name",
            headerName: "Name",
            flex: 1,
            editable: true,
            renderCell: (params) => (
                <DGCellEdit params={params} onClick={handleClickEdit} />
            ),
        },
        {
            field: "description",
            headerName: "Description",
            flex: 1,
            editable: true,
            renderCell: (params) => (
                <DGCellEdit params={params} onClick={handleClickEdit} />
            ),
        },
        {
            field: "confluence_space_keys",
            headerName: "Confluence space keys",
            flex: 1,
            editable: true,
            renderCell: (params) => (
                <DGCellEdit params={params} onClick={handleClickEdit} />
            ),
        },
        {
            field: "youtrack_project",
            headerName: "Youtrack project (short name)",
            flex: 1,
            editable: true,
            renderCell: (params) => (
                <DGCellEdit params={params} onClick={handleClickEdit} />
            ),
        },
        {
            field: "is_active",
            headerName: "Active",
            flex: 1,
            type: "boolean",
            editable: true,
        },
        {
            field: "created",
            headerName: "Created",
            flex: 1,
            renderCell: ({ row }) => formatDateTimeHumanReadable(row.created),
        },
    ];

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

    const handleChangeSearch = useCallback(debounce(search, 300), []);

    const handleSortModelChange = (sortModel: GridSortModel) => {
        handleListStateChange("sort_by")(
            sortModel.map((item) => ({
                columnKey: item.field,
                direction: item.sort?.toUpperCase(),
            })),
        );
    };

    const handleProcessRowUpdate = async (newRow: PortalT, oldRow: PortalT) => {
        const updatedValues = pickBy(
            newRow,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            (v, k) => oldRow[k as keyof PortalT] !== v,
        );

        if (isEmpty(updatedValues)) return oldRow;

        try {
            await updatePortal({
                id: newRow.id,
                ...updatedValues,
            }).unwrap();
            toast.success("Portal was successfully updated");
        } catch (error) {
            toastError(error);
            return oldRow;
        }

        return newRow;
    };

    const handleCellEditStop = (
        params: GridCellEditStopParams,
        event: MuiEvent,
    ) => {
        if (params.reason === GridCellEditStopReasons.cellFocusOut) {
            event.defaultMuiPrevented = true;
            apiRef.current.stopCellEditMode({
                id: params.id,
                field: params.field,
                ignoreModifications: true,
            });
        }
    };

    const count = calculatePageCount(listState.limit, portals?.payload?.count);

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box display="flex" gap={1}>
                <Box flex={1}>
                    <SearchField onChange={handleChangeSearch} />
                </Box>

                <FormControlLabel
                    sx={{ ml: 0.5 }}
                    control={<Switch />}
                    checked={!isFilterSet("is_active", listState)}
                    label="Show deleted"
                    onChange={switchFilterDisabled(
                        "is_active",
                        "is_active:true",
                        listState,
                        setListState,
                    )}
                />

                <PortalForm />
            </Box>

            <DataGridPro
                apiRef={apiRef}
                columns={columns}
                rows={portals?.payload?.items || []}
                slots={{ toolbar: GridToolbar }}
                onSortModelChange={handleSortModelChange}
                processRowUpdate={handleProcessRowUpdate}
                onCellEditStop={handleCellEditStop}
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

                {portals?.payload?.count ? (
                    <Typography fontSize={14}>
                        Total results: {portals.payload.count}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    );
};

export { PortalList };
