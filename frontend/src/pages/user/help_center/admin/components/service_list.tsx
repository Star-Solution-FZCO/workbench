import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RestoreIcon from "@mui/icons-material/Restore";
import {
    Box,
    Button,
    FormControlLabel,
    Pagination,
    Switch,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    DataGridPro,
    GridColDef,
    GridSortModel,
    GridToolbar,
} from "@mui/x-data-grid-pro";
import {
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
import { debounce, omit } from "lodash";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { SelectOptionT, ServiceT } from "types";
import { calculatePageCount, toastError } from "utils";
import { formatDateTimeHumanReadable } from "utils/convert";

const ServiceList = () => {
    const navigate = useNavigate();

    const [page, setPage] = useState(1);
    const [listState, setListState] = useState<ListStateT>({
        ...initialListState,
        filter: { is_active: "is_active:true" },
    });
    const [portal, setPortal] = useState<SelectOptionT | null>(null);

    const [updateService] = helpCenterApi.useUpdateServiceMutation();
    const [deleteService] = helpCenterApi.useDeleteServiceMutation();

    const {
        data: services,
        isLoading,
        isFetching,
    } = helpCenterApi.useListServiceQuery(
        makeListParams(listState, ["name___icontains"]),
    );

    const handleClickEdit = (e: React.MouseEvent, service: ServiceT) => {
        e.preventDefault();
        navigate(`/help-center/services/edit/${service.id}`);
    };

    const handleClickDelete = (e: React.MouseEvent, service: ServiceT) => {
        e.preventDefault();

        const confirmed = confirm(
            `Are you sure you want to delete the service "${service.name}"?`,
        );

        if (!confirmed) return;

        deleteService(service.id)
            .unwrap()
            .then(() => {
                toast.success(
                    `Service "${service.name}" was successfully deleted`,
                );
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleClickRestore = (e: React.MouseEvent, service: ServiceT) => {
        e.preventDefault();

        const confirmed = confirm(
            `Are you sure you want to restore the service "${service.name}"?`,
        );

        if (!confirmed) return;

        updateService({ id: service.id, is_active: true })
            .unwrap()
            .then(() => {
                toast.success(
                    `Service "${service.name}" was successfully restored`,
                );
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const columns: GridColDef<ServiceT>[] = [
        {
            field: "",
            headerName: "Actions",
            disableColumnMenu: true,
            resizable: false,
            filterable: false,
            sortable: false,
            renderCell: ({ row }) => (
                <Box
                    display="flex"
                    width="100%"
                    justifyContent="center"
                    gap={1}
                >
                    <Tooltip title="Edit" placement="top">
                        <EditIcon
                            onClick={(e) => handleClickEdit(e, row)}
                            sx={{
                                color: "#757575",
                                cursor: "pointer",
                            }}
                            fontSize="small"
                        />
                    </Tooltip>

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
        },
        {
            field: "portal",
            headerName: "Portal",
            flex: 1,
            sortable: false,
            renderCell: ({ row }) => row.group.portal.name,
        },
        {
            field: "group",
            headerName: "Portal group",
            flex: 1,
            sortable: false,
            renderCell: ({ row }) => row.group.name,
        },
        {
            field: "tags",
            headerName: "Tags",
            flex: 1,
        },
        {
            field: "is_active",
            headerName: "Active",
            flex: 1,
            type: "boolean",
        },
        {
            field: "created",
            headerName: "Created",
            flex: 1,
            renderCell: ({ row }) => formatDateTimeHumanReadable(row.created),
        },
    ];

    const handleChangeFilter = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const count = calculatePageCount(listState.limit, services?.payload?.count);

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

                <Button
                    onClick={() => navigate("/help-center/services/create")}
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                    color="secondary"
                >
                    Add service
                </Button>
            </Box>

            <Box display="flex" gap={1}>
                <ReduxSelect
                    value={portal}
                    name="portal"
                    label="Portal"
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    placeholder={<SelectPlaceholder />}
                    optionsLoadFn={helpCenterApi.useListPortalSelectQuery}
                    onChange={(newValue) => {
                        setPortal(newValue);
                    }}
                    isClearable
                    emptyOption
                />

                {portal && (
                    <ReduxSelect
                        name="portal_group"
                        label="Portal group"
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        placeholder={<SelectPlaceholder />}
                        optionsLoadFn={(search) =>
                            helpCenterApi.useListPortalGroupSelectQuery({
                                portal_id: portal.value as number,
                                search,
                            })
                        }
                        onChange={(newValue) =>
                            handleChangeFilter(
                                newValue,
                                "portal_group",
                                "portal_group_id",
                            )
                        }
                        isClearable
                        emptyOption
                    />
                )}
            </Box>

            <DataGridPro
                columns={columns}
                rows={services?.payload?.items || []}
                slots={{ toolbar: GridToolbar }}
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

                {services?.payload?.count ? (
                    <Typography fontSize={14}>
                        Total results: {services.payload.count}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    );
};

export { ServiceList };
