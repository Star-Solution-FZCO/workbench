import SummarizeIcon from "@mui/icons-material/Summarize";
import {
    Box,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    DataGridPro,
    GridCellEditStopParams,
    GridCellEditStopReasons,
    GridColDef,
    GridEventListener,
    GridToolbar,
    MuiEvent,
    useGridApiRef,
} from "@mui/x-data-grid-pro";
import { DGCellEdit, DataGridContextMenu, Employee } from "_components";
import { employeesApi } from "_redux";
import { isEmpty, pickBy } from "lodash";
import { FC, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { EmployeeLinkedAccountT, TeamMemberItemT, TeamMemberT } from "types";
import { convertSourceName } from "utils/convert";
import DismissButton from "./dismiss";

const getUniqueSources = (
    linkedAccounts: EmployeeLinkedAccountT[],
): { id: number; name: string }[] => {
    const sources = new Map<number, string>();

    linkedAccounts.forEach((account) => {
        sources.set(account.source.id, account.source.name);
    });

    return Array.from(sources, ([id, name]) => ({ id, name }));
};

const createSourceColumns = (uniqueSources: { id: number; name: string }[]) => {
    return uniqueSources.map(
        (source): GridColDef<TeamMemberItemT> => ({
            field: convertSourceName(source.name) + "_account_id",
            headerName: source.name + " Account ID",
            flex: 1,
            sortable: false,
            valueGetter: (_, row) => {
                const account = row.linked_accounts.find(
                    (account) => account.source.id === source.id,
                );
                return account ? account.account_id : "";
            },
        }),
    );
};

const TeamMembers: FC<{
    team_id: number;
    data: TeamMemberItemT[];
    can_dismiss: boolean;
    can_edit?: boolean;
}> = ({ team_id, data: members, can_dismiss, can_edit }) => {
    const navigate = useNavigate();

    const [contextMenuEvent, setContextMenuEvent] = useState<any | null>(null);
    const [contextMenuEventCurrentTarget, setContextMenuEventCurrentTarget] =
        useState<any | null>(null);

    const [updateEmployee] = employeesApi.useUpdateEmployeeMutation();

    const [getCSV, getCSVProps] = employeesApi.useLazyExportTeamMembersQuery();

    const apiRef = useGridApiRef();

    const handleClickEdit = useCallback(
        (id: number, field: string) => {
            apiRef.current.startCellEditMode({ id, field });
        },
        [apiRef],
    );

    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        setContextMenuEvent(event);
        setContextMenuEventCurrentTarget(event.currentTarget);
    };

    const handleCloseContextMenu = () => {
        setContextMenuEvent(null);
        setContextMenuEventCurrentTarget(null);
    };

    const columns = useMemo<GridColDef<TeamMemberItemT>[]>(() => {
        const uniqueSources = getUniqueSources(
            members.map((m) => m.linked_accounts).flat(),
        );
        const sourceColumns = createSourceColumns(uniqueSources);

        return [
            {
                field: "id",
                headerName: "Actions",
                width: 60,
                renderCell: ({ row }) =>
                    !row.counteragent ? (
                        <DismissButton member={row} can_dismiss={can_dismiss} />
                    ) : null,
                sortable: false,
            },
            {
                field: "english_name",
                headerName: "Member",
                flex: 1,
                renderCell: ({ row }) =>
                    !row.counteragent ? (
                        <Employee
                            employee={{
                                id: Number(row.id),
                                english_name: row.english_name,
                                pararam: row.pararam,
                            }}
                        />
                    ) : (
                        row.english_name
                    ),
            },
            {
                field: "counteragent",
                headerName: "Counteragent",
                type: "boolean",
                editable: false,
            },
            {
                field: "pararam",
                headerName: "Pararam",
                flex: 1,
                valueGetter: (_, row) =>
                    row.pararam ? `@${row.pararam}` : null,
            },
            {
                field: "position",
                headerName: "Position",
                flex: 1,
            },
            {
                field: "team_position",
                headerName: "Team role",
                flex: 1,
                editable: can_edit,
                renderCell: (params) =>
                    !params.row.counteragent ? (
                        <DGCellEdit params={params} onClick={handleClickEdit} />
                    ) : null,
            },
            {
                field: "grade",
                headerName: "Grade",
                flex: 1,
            },
            ...sourceColumns,
        ];
    }, [can_dismiss, can_edit, handleClickEdit]);

    const handleProcessRowUpdate = async (
        newRow: TeamMemberItemT,
        oldRow: TeamMemberItemT,
    ) => {
        try {
            const updatedValues = pickBy(
                newRow,
                // @ts-ignore
                (v, k) => oldRow[k as keyof TeamMemberT] !== v,
            );

            if (isEmpty(updatedValues)) return oldRow;

            await updateEmployee({
                id: Number(newRow.id),
                ...updatedValues,
            }).unwrap();
            toast.success("Team member data updated");
        } catch (e) {
            toast.error("An error occurred while updating the data");
            return oldRow;
        }

        return newRow;
    };

    const handleRowClick: GridEventListener<"rowClick"> = ({ row }) => {
        const path = row.counteragent
            ? `/counteragents/view/${row.id.split("-")[0]}`
            : `/people/view/${row.id}`;

        navigate(path);
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

    const getCSVHandle = () => {
        getCSV(team_id);
    };

    return (
        <Box display="flex" flexDirection="column" gap="8px" height="100%">
            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
            >
                <Typography fontWeight={500}>
                    Members ({members.length}):
                </Typography>

                <Tooltip title="Export CSV">
                    <IconButton
                        sx={{ p: 0 }}
                        onClick={getCSVHandle}
                        color="success"
                        disabled={getCSVProps.isLoading}
                    >
                        {getCSVProps.isLoading ? (
                            <CircularProgress size={20} color="success" />
                        ) : (
                            <SummarizeIcon />
                        )}
                    </IconButton>
                </Tooltip>
            </Box>

            <DataGridPro
                sx={{
                    "& .MuiDataGrid-row": {
                        cursor: "pointer",
                    },
                }}
                apiRef={apiRef}
                columns={columns}
                rows={members}
                initialState={{
                    sorting: {
                        sortModel: [
                            { field: "team_position", sort: "desc" },
                            { field: "english_name", sort: "asc" },
                        ],
                    },
                }}
                slots={{
                    toolbar: GridToolbar,
                }}
                slotProps={{
                    row: {
                        onContextMenu: handleContextMenu,
                    },
                }}
                onRowClick={handleRowClick}
                processRowUpdate={handleProcessRowUpdate}
                onCellEditStop={handleCellEditStop}
                density="compact"
            />

            <DataGridContextMenu
                newTabPath={
                    contextMenuEventCurrentTarget
                        ? contextMenuEventCurrentTarget
                              .getAttribute("data-id")
                              .includes("counteragent")
                            ? "/counteragents/view"
                            : "/people/view"
                        : ""
                }
                contextMenuEvent={contextMenuEvent}
                contextMenuEventCurrentTarget={contextMenuEventCurrentTarget}
                onClose={handleCloseContextMenu}
            />
        </Box>
    );
};

export default TeamMembers;
