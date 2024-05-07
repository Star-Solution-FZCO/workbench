import AddIcon from "@mui/icons-material/Add";
import LinkIcon from "@mui/icons-material/Link";
import SummarizeIcon from "@mui/icons-material/Summarize";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Autocomplete,
    Box,
    Button,
    Chip,
    FormControlLabel,
    IconButton,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    DataGridPro,
    GridColDef,
    GridEventListener,
} from "@mui/x-data-grid-pro";
import { nanoid } from "@reduxjs/toolkit";
import {
    AddGroupButton,
    DataGridContextMenu,
    EditButton,
    Employee,
    InviteButton,
    JoinButton,
    ListStateT,
    Modal,
    SearchField,
    initialListState,
    isFilterSet,
} from "_components";
import { catalogsApi, employeesApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import HierarchyIcon from "assets/icons/hierarchy";
import { todayUTC } from "config";
import { debounce, map, omit } from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SelectTagOptionT } from "types";
import { TeamT } from "types/models";
import { formatDateHumanReadable, getContrastColorHex } from "utils/convert";
import { TeamHierarchy } from "./components/hierarchy";
import { TeamTag } from "./components/tag";
import { EditEmployeeTeamForm } from "./edit_team_form";
import { CreateTeamForm, EditTeamForm } from "./form";
import {
    TeamInvitationRequestDialog,
    TeamJoinRequestDialog,
} from "./joinRequest";

export const TeamList: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const profile = useAppSelector(({ profile }) => profile.payload);

    const [listState, setListState] = useState({
        ...initialListState,
        filter: { archived: "is_archived:false" },
    });

    const [openEditEmployeeTeamWindow, setOpenEditEmployeeTeamWindow] =
        useState<{ id: number | null; is_open: boolean }>({
            id: null,
            is_open: false,
        });

    const [modalOpen, setModalOpen] = useState(false);
    const [teamId, setTeamId] = useState<number | null>(null);
    const [dialogType, setDialogType] = useState<
        "create" | "edit" | "join" | "invite" | null
    >(null);
    const [contextMenuEvent, setContextMenuEvent] = useState<any | null>(null);
    const [contextMenuEventCurrentTarget, setContextMenuEventCurrentTarget] =
        useState<any | null>(null);

    const [tagsAutocompleteValue, setTagsAutocompleteValue] = useState<
        Array<SelectTagOptionT>
    >([]);
    const [tagsAutocompleteInputValue, setTagsAutocompleteInputValue] =
        useState("");

    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        setContextMenuEvent(event);
        setContextMenuEventCurrentTarget(event.currentTarget);
    };

    const handleCloseContextMenu = () => {
        setContextMenuEvent(null);
        setContextMenuEventCurrentTarget(null);
    };

    const { data, isLoading, isFetching } = employeesApi.useListTeamQuery(
        makeListParams(listState, ["name___icontains", "key___icontains"]),
    );

    const without_team = employeesApi.useListEmployeeQuery(
        makeListParams(
            {
                ...initialListState,
                limit: 200,
                filter: {
                    team: "team_id:null",
                    active: "active:true",
                    work_started: `work_started___le:"${todayUTC()}"`,
                },
            },
            [],
        ),
    );

    const unemployed = employeesApi.useListEmployeeQuery(
        makeListParams(
            {
                ...initialListState,
                limit: 200,
                filter: {
                    active: "active:true",
                    work_started: `work_started___gt:"${todayUTC()}"`,
                },
            },
            [],
        ),
    );

    const { data: tags } = catalogsApi.useListTeamTagSelectQuery(
        tagsAutocompleteInputValue,
    );

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

    const handleChangeSearch = useCallback(debounce(search, 300), []);

    const handleRowClick: GridEventListener<"rowClick"> = (params) => {
        navigate(
            `view/${params.row.id}/${params.row.name.replaceAll(" ", "+")}`,
        );
    };

    const openDialog = (
        dialogType: "create" | "edit" | "join" | "invite",
        teamId?: number,
    ) => {
        setTeamId(teamId || null);
        setDialogType(dialogType);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setDialogType(null);
        setTeamId(null);
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

    const handleChangeTags = useCallback(
        (tags: Array<SelectTagOptionT>) => {
            setTagsAutocompleteValue(tags);

            setSearchParams(
                tags.length ? { tags: tags.map((t) => t.value).join(",") } : {},
            );

            const newFilter = tags.length
                ? {
                      ...listState.filter,
                      tags:
                          "tags___in:" + tags.map((tag) => tag.value).join(","),
                  }
                : omit(listState.filter, "tags");

            handleListStateChange("filter")(newFilter);
        },
        [handleListStateChange, listState.filter, setSearchParams],
    );

    const columns = useMemo<GridColDef<TeamT>[]>(
        () => [
            {
                field: "id",
                headerName: "",
                sortable: false,
                resizable: false,
                filterable: false,
                renderCell: ({ row }) => (
                    <Box display="flex" alignItems="center" gap="4px">
                        {!row.is_archived &&
                            (profile.admin ||
                                profile.id === row.manager?.value) && (
                                <EditButton
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        openDialog("edit", row.id);
                                    }}
                                />
                            )}
                        {!row.is_archived && !row.is_current_user_member && (
                            <JoinButton
                                onClick={(event) => {
                                    event.stopPropagation();
                                    openDialog("join", row.id);
                                }}
                            />
                        )}
                        {!row.is_archived &&
                            profile.id === row.manager?.value && (
                                <InviteButton
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        openDialog("invite", row.id);
                                    }}
                                />
                            )}
                    </Box>
                ),
            },
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
            {
                field: "tags",
                headerName: "Tags",
                flex: 1,
                sortable: false,
                filterable: false,
                renderCell: ({ row }) =>
                    row.tags.length ? (
                        <Box display="flex" gap={0.5}>
                            {row.tags.map((t) => (
                                <Tooltip key={nanoid()} title={t.description}>
                                    <TeamTag
                                        tag={t}
                                        onClick={() => {
                                            handleChangeTags([t]);
                                        }}
                                    />
                                </Tooltip>
                            ))}
                        </Box>
                    ) : null,
            },
        ],
        [profile.admin, profile.id, handleChangeTags],
    );

    const renderEditEmployeeTeamModalWindow = (
        id: number,
        onClose: () => void,
    ) => {
        return (
            <Modal open onClose={onClose}>
                <EditEmployeeTeamForm
                    initialValues={{ id, team: null }}
                    onSuccess={onClose}
                />
            </Modal>
        );
    };

    useEffect(() => {
        if (tags && searchParams.has("tags")) {
            const tagsParamValue = searchParams.get("tags");

            handleListStateChange("filter")({
                ...listState.filter,
                tags: "tags___in:" + tagsParamValue,
            });

            setTagsAutocompleteValue(
                tags.filter((tag) =>
                    tagsParamValue?.includes(tag.value as string),
                ),
            );
        }
    }, [handleListStateChange, searchParams, tags]);

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            {openEditEmployeeTeamWindow.is_open &&
                renderEditEmployeeTeamModalWindow(
                    openEditEmployeeTeamWindow.id as number,
                    () => {
                        setOpenEditEmployeeTeamWindow({
                            id: null,
                            is_open: false,
                        });
                    },
                )}

            {!without_team.isUninitialized &&
                without_team.data &&
                without_team.data.payload.count > 0 && (
                    <Accordion
                        sx={{
                            borderRadius: "8px",
                            "&:before": {
                                display: "none",
                            },
                        }}
                        variant="outlined"
                        disableGutters
                    >
                        <AccordionSummary>
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                width="100%"
                            >
                                <Typography>
                                    People without team (
                                    {without_team.data.payload.count} total)
                                </Typography>

                                <IconButton
                                    sx={{ p: 0 }}
                                    onClick={() => navigate("without-team")}
                                    color="info"
                                >
                                    <LinkIcon />
                                </IconButton>
                            </Box>
                        </AccordionSummary>

                        <AccordionDetails>
                            {map(without_team.data.payload.items, (user) => (
                                <Box
                                    key={user.id}
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                >
                                    {["admin", "super_admin", "super_hr"].some(
                                        (role) => profile.roles?.includes(role),
                                    ) && (
                                        <AddGroupButton
                                            tooltip="Add to team"
                                            onClick={() =>
                                                setOpenEditEmployeeTeamWindow({
                                                    id: user.id,
                                                    is_open: true,
                                                })
                                            }
                                        />
                                    )}

                                    <Employee employee={user} />

                                    <Typography>
                                        {user.pararam && `(@${user.pararam})`}
                                    </Typography>
                                </Box>
                            ))}
                        </AccordionDetails>
                    </Accordion>
                )}

            {!unemployed.isUninitialized &&
                unemployed.data &&
                unemployed.data.payload.count > 0 && (
                    <Accordion
                        sx={{
                            borderRadius: "8px",
                            "&:before": {
                                display: "none",
                            },
                        }}
                        variant="outlined"
                        disableGutters
                    >
                        <AccordionSummary>
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                width="100%"
                            >
                                <Typography>
                                    Upcoming people (
                                    {unemployed.data.payload.count} total)
                                </Typography>
                            </Box>
                        </AccordionSummary>

                        <AccordionDetails>
                            {map(unemployed.data.payload.items, (user) => (
                                <Box
                                    key={user.id}
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                >
                                    <Typography>
                                        {formatDateHumanReadable(
                                            user.work_started,
                                        )}
                                    </Typography>

                                    <Employee employee={user} />

                                    <Typography>
                                        {user.pararam && `(@${user.pararam})`}
                                    </Typography>
                                </Box>
                            ))}
                        </AccordionDetails>
                    </Accordion>
                )}

            <Modal open={modalOpen} onClose={handleCloseModal}>
                {dialogType === "create" && (
                    <CreateTeamForm onClose={handleCloseModal} />
                )}
                {dialogType === "edit" && teamId && (
                    <EditTeamForm id={teamId} onClose={handleCloseModal} />
                )}
                {dialogType === "join" && teamId && (
                    <TeamJoinRequestDialog
                        team_id={teamId}
                        onClose={handleCloseModal}
                    />
                )}
                {dialogType === "invite" && teamId && (
                    <TeamInvitationRequestDialog
                        team_id={teamId}
                        onClose={handleCloseModal}
                    />
                )}
            </Modal>

            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Box flex={1}>
                    <SearchField onChange={handleChangeSearch} />
                </Box>

                {/* tags */}
                <Box width="320px">
                    <Autocomplete
                        sx={{
                            "& .MuiAutocomplete-inputRoot": {
                                flexWrap: "nowrap !important",
                            },
                        }}
                        options={tags || []}
                        getOptionLabel={(option) => option.label}
                        value={tagsAutocompleteValue}
                        onChange={(_, tags) => handleChangeTags(tags)}
                        inputValue={tagsAutocompleteInputValue}
                        onInputChange={(_, newInputValue) => {
                            setTagsAutocompleteInputValue(newInputValue);
                        }}
                        renderInput={(props) => (
                            <TextField {...props} label="Tags" size="small" />
                        )}
                        renderTags={(tagValue, getTagProps) => {
                            return tagValue.map((option, index) => (
                                <Tooltip
                                    {...getTagProps({ index })}
                                    title={option.description}
                                >
                                    <Chip
                                        sx={{
                                            height: "24px",
                                            bgcolor: option.color,
                                            color:
                                                option.color &&
                                                getContrastColorHex(
                                                    option.color,
                                                ),
                                            "&:hover": {
                                                bgcolor: option.color
                                                    ? option.color +
                                                      " !important"
                                                    : undefined,
                                            },
                                        }}
                                        label={option.label}
                                        variant="outlined"
                                    />
                                </Tooltip>
                            ));
                        }}
                        multiple
                    />
                </Box>

                <Button
                    onClick={() => navigate("/teams/reports")}
                    variant="outlined"
                    size="small"
                    color="success"
                    startIcon={<SummarizeIcon />}
                >
                    Reports
                </Button>

                {profile.admin && (
                    <Button
                        onClick={() => openDialog("create")}
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                    >
                        Add team
                    </Button>
                )}

                <TeamHierarchy />

                <Tooltip title="Organizational structure">
                    <Button
                        onClick={() => navigate("/people/structure")}
                        variant="outlined"
                        size="small"
                        color="info"
                    >
                        <HierarchyIcon />
                    </Button>
                </Tooltip>

                <FormControlLabel
                    sx={{ ml: 0.1 }}
                    label="Show archived"
                    control={<Switch size="small" />}
                    checked={!isFilterSet("archived", listState)}
                    onChange={handleFilterArchived}
                />
            </Box>

            <DataGridPro
                sx={{
                    "& .MuiDataGrid-row": {
                        cursor: "pointer",
                    },
                }}
                columns={columns}
                rows={data?.payload?.items || []}
                slotProps={{
                    row: {
                        onContextMenu: handleContextMenu,
                    },
                }}
                onRowClick={handleRowClick}
                density="compact"
                loading={isLoading || isFetching}
            />

            <DataGridContextMenu
                newTabPath="/teams/view"
                contextMenuEvent={contextMenuEvent}
                contextMenuEventCurrentTarget={contextMenuEventCurrentTarget}
                onClose={handleCloseContextMenu}
            />
        </Box>
    );
};
