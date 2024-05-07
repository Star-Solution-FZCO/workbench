import CloseIcon from "@mui/icons-material/Close";
import { Box, Tooltip } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { ApproveButton, ErrorTooltipHoverIconButtonButton } from "_components";
import { ManagerView } from "_components/views/manager";
import { requestsApi, useAppSelector } from "_redux";
import { formatInTimeZone } from "date-fns-tz";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { RequestT } from "types/models";
import { toastError } from "utils";
import { ReasonDialogForm } from "./reason_dialog";
import { RequestListView } from "./request_list_view";
import { requestIconColor, requestListInitialParams } from "./utils";

const JoinTeamRequestListView = () => {
    const navigate = useNavigate();

    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "UTC";

    const [requestDialogOpen, setRequestDialogOpen] = useState<number | null>(
        null,
    );

    const [approveRequest] = requestsApi.useApproveJoinTeamRequestMutation();

    const handleOnApprove = useCallback(
        (request: RequestT) => {
            const confirmed = confirm(
                `Are you sure you want to add ${request.created_by.label} to "${request.data.team.label}" team?`,
            );
            if (!confirmed) return;

            approveRequest({ id: request.id })
                .then(() => {
                    toast.success("Request successfully approved");
                })
                .catch((error) => {
                    toastError(error);
                });
        },
        [approveRequest],
    );

    const columns = useMemo<GridColDef<RequestT>[]>(
        () => [
            {
                field: "id",
                headerName: "Actions",
                sortable: false,
                filterable: false,
                hideable: false,
                disableColumnMenu: true,
                renderCell: ({ row }) => (
                    <Box
                        display="flex"
                        alignItems="center"
                        height="100%"
                        gap="4px"
                    >
                        <Tooltip title={row.status}>
                            <Box
                                width={20}
                                height={20}
                                sx={{
                                    backgroundColor: requestIconColor(
                                        row.status,
                                    ),
                                    borderRadius: 16,
                                }}
                            />
                        </Tooltip>

                        <Box display="flex" gap="2px">
                            {row.can_approve && (
                                <ApproveButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOnApprove(row);
                                    }}
                                />
                            )}
                            {row.can_cancel && (
                                <ErrorTooltipHoverIconButtonButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRequestDialogOpen(row.id);
                                    }}
                                    ButtonIcon={CloseIcon}
                                    tooltip="Close request"
                                />
                            )}
                        </Box>
                    </Box>
                ),
            },
            { field: "subject", headerName: "Subject", flex: 1 },
            { field: "status", headerName: "Status", flex: 1 },
            {
                field: "created_by_id",
                headerName: "Created By",
                flex: 1,
                valueGetter: (_, { created_by }) => created_by.label,
                renderCell: ({ row: { created_by } }) => (
                    <ManagerView
                        key={created_by.value}
                        label={created_by.label}
                        id={created_by.value as number}
                    />
                ),
            },
            {
                field: "updated",
                headerName: "Updated",
                flex: 1,
                valueGetter: (_, row) => new Date(row.updated),
                renderCell: ({ row }) =>
                    formatInTimeZone(
                        row.updated + "Z",
                        timezone,
                        "dd MMM yyyy HH:mm:ss",
                    ),
                type: "dateTime",
            },
            {
                field: "comment",
                headerName: "Comment",
                flex: 1,
            },
            { field: "reason", headerName: "Reason", flex: 1 },
            {
                field: "issue",
                headerName: "Issue",
                flex: 1,
                valueGetter: (_, { metadata }) => metadata?.youtrack,
                renderCell: ({ row: { metadata } }) => (
                    <Box>
                        {metadata?.youtrack && (
                            <a href={metadata?.youtrack}>
                                {metadata?.youtrack}
                            </a>
                        )}
                    </Box>
                ),
            },
        ],
        [handleOnApprove, timezone],
    );

    return (
        <>
            <ReasonDialogForm
                ids={requestDialogOpen ? [requestDialogOpen] : []}
                onClose={() => setRequestDialogOpen(null)}
            />

            <RequestListView
                initialParams={requestListInitialParams}
                queryFn={requestsApi.useListJoinTeamRequestQuery}
                columns={columns}
                datagridProps={{
                    initialState: {
                        sorting: {
                            sortModel: [
                                {
                                    field: "updated",
                                    sort: "desc",
                                },
                            ],
                        },
                        columns: {
                            columnVisibilityModel: {
                                status: false,
                                comment: false,
                                reason: false,
                                issue: false,
                            },
                        },
                    },
                }}
                onRowClick={({ row }) =>
                    navigate(`/requests/join-team/${row.id}`)
                }
                search_fields={["subject___icontains"]}
            />
        </>
    );
};

export { JoinTeamRequestListView };
