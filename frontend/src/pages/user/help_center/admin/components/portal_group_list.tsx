/* eslint-disable @typescript-eslint/no-explicit-any */
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
    ReduxSelect,
    SearchField,
    SelectPlaceholder,
    initialListState,
    isFilterSet,
    switchFilterDisabled,
} from "_components";
import { helpCenterApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { debounce, isEmpty, omit, pickBy } from "lodash";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { PortalGroupT } from "types";
import { calculatePageCount, toastError } from "utils";
import { formatDateTimeHumanReadable } from "utils/convert";
import { PortalGroupForm } from "../../components";

const PortalGroupsList = () => {
    const [page, setPage] = useState(1);
    const [listState, setListState] = useState<ListStateT>({
        ...initialListState,
        filter: { is_active: "is_active:true" },
    });

    const apiRef = useGridApiRef();

    const [updatePortalGroup] = helpCenterApi.useUpdatePortalGroupMutation();
    const [deletePortalGroup] = helpCenterApi.useDeletePortalGroupMutation();

    const {
        data: groups,
        isLoading,
        isFetching,
    } = helpCenterApi.useListPortalGroupsQuery(
        makeListParams(listState, ["name___icontains"]),
    );

    const handleClickEdit = (id: number, field: string) => {
        apiRef.current.startCellEditMode({ id, field });
    };

    const handleClickDelete = (
        e: React.MouseEvent,
        portalGroup: PortalGroupT,
    ) => {
        e.preventDefault();

        const confirmed = confirm(
            `Are you sure you want to delete the portal group "${portalGroup.name}"?`,
        );

        if (!confirmed) return;

        deletePortalGroup(portalGroup.id)
            .unwrap()
            .then(() => {
                toast.success(
                    `Portal group "${portalGroup.name}" was successfully deleted`,
                );
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleClickRestore = (
        e: React.MouseEvent,
        portalGroup: PortalGroupT,
    ) => {
        e.preventDefault();

        const confirmed = confirm(
            `Are you sure you want to restore the portal group "${portalGroup.name}"?`,
        );

        if (!confirmed) return;

        updatePortalGroup({ id: portalGroup.id, is_active: true })
            .unwrap()
            .then(() => {
                toast.success(
                    `Portal group "${portalGroup.name}" was successfully restored`,
                );
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const columns: GridColDef<PortalGroupT>[] = [
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
            field: "portal",
            headerName: "Portal",
            flex: 1,
            renderCell: ({ row }) => row.portal.name,
        },
        {
            field: "is_active",
            headerName: "Active",
            type: "boolean",
            flex: 1,
            editable: true,
        },
        {
            field: "created",
            headerName: "Created",
            flex: 1,
            renderCell: ({ row }) => formatDateTimeHumanReadable(row.created),
        },
    ];

    const handleChangeFilter = (
        newValue: any,
        key: string,
        filterValue: string,
    ) => {
        if (!newValue) {
            setListState({
                ...listState,
                filter: omit(listState.filter, key),
            });
        } else {
            setListState({
                ...listState,
                filter: {
                    ...listState.filter,
                    [key]: `${filterValue}:${newValue.value}`,
                },
            });
        }
    };

    const handleListStateChange = useCallback(
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

    const handleProcessRowUpdate = async (
        newRow: PortalGroupT,
        oldRow: PortalGroupT,
    ) => {
        const updatedValues = pickBy(
            newRow,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            (v, k) => oldRow[k as keyof PortalGroupT] !== v,
        );

        if (isEmpty(updatedValues)) return oldRow;

        try {
            await updatePortalGroup({
                id: newRow.id,
                ...updatedValues,
            }).unwrap();
            toast.success("Portal group was successfully updated");
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

    const count = calculatePageCount(listState.limit, groups?.payload?.count);

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

                <PortalGroupForm />
            </Box>

            <Box display="flex" gap={1}>
                <ReduxSelect
                    name="portal"
                    label="Portal"
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    placeholder={<SelectPlaceholder />}
                    optionsLoadFn={helpCenterApi.useListPortalSelectQuery}
                    onChange={(newValue) =>
                        handleChangeFilter(newValue, "portal", "portal_id")
                    }
                    isClearable
                    emptyOption
                />
            </Box>

            <DataGridPro
                apiRef={apiRef}
                columns={columns}
                rows={groups?.payload?.items || []}
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

                {groups?.payload?.count ? (
                    <Typography fontSize={14}>
                        Total results: {groups.payload.count}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    );
};

export { PortalGroupsList };
