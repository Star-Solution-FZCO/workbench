import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import {
    Box,
    Button,
    IconButton,
    IconButtonPropsColorOverrides,
    Tooltip,
    Typography,
} from "@mui/material";
import { OverridableStringUnion } from "@mui/types";
import { DataGridPro, GridColDef, GridToolbar } from "@mui/x-data-grid-pro";
import { Modal } from "_components";
import { scheduleApi } from "_redux";
import React, { FC, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { EmployeeScheduleExclusionMoveT } from "types";
import { toastError } from "utils";
import { formatDateHumanReadable } from "utils/convert";
import { EditMovedDay } from "./edit";

interface IActionButtonProps {
    title: string;
    icon: React.ReactNode;
    color: OverridableStringUnion<
        | "inherit"
        | "default"
        | "primary"
        | "secondary"
        | "error"
        | "info"
        | "success"
        | "warning",
        IconButtonPropsColorOverrides
    >;
    exclusion: EmployeeScheduleExclusionMoveT;
    onClick: (exclusion: EmployeeScheduleExclusionMoveT) => void;
    disabled?: boolean;
}

const ActionButton: FC<IActionButtonProps> = ({
    title,
    icon,
    color,
    exclusion,
    onClick,
    disabled,
}) => {
    return (
        <Tooltip title={title}>
            <IconButton
                size="small"
                color={color}
                onClick={() => onClick(exclusion)}
                disabled={disabled}
            >
                {icon}
            </IconButton>
        </Tooltip>
    );
};

interface IActionButtonProps {
    exclusion: EmployeeScheduleExclusionMoveT;
    onClick: (exclusion: EmployeeScheduleExclusionMoveT) => void;
    disabled?: boolean;
}

interface IScheduleMoveListProps {
    employee_id: number;
}

const ScheduleMoveList: FC<IScheduleMoveListProps> = ({ employee_id: id }) => {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteFormOpen, setDeleteFormOpen] = useState(false);

    const [exclusion, setExclusion] =
        useState<EmployeeScheduleExclusionMoveT | null>(null);

    const { data, isLoading } =
        scheduleApi.useListEmployeeScheduleExclusionMoveQuery({
            id,
        });
    const [cancelExclusion] =
        scheduleApi.useCancelEmployeeScheduleExclusionMutation();

    const handleCloseEditModal = () => {
        setEditModalOpen(false);
        setExclusion(null);
    };

    const handleClickEditButton = (
        exclusion: EmployeeScheduleExclusionMoveT,
    ) => {
        setEditModalOpen(true);
        setExclusion(exclusion);
    };

    const handleCloseDeleteForm = () => {
        setDeleteFormOpen(false);
        setExclusion(null);
    };

    const handleClickDeleteButton = (
        exclusion: EmployeeScheduleExclusionMoveT,
    ) => {
        setDeleteFormOpen(true);
        setExclusion(exclusion);
    };

    const handleCancelExclusion = () => {
        if (!exclusion) return;
        cancelExclusion({ id: id, guid: exclusion.guid })
            .unwrap()
            .then(() => {
                toast.success("Exclusion has been successfully cancelled");
                handleCloseDeleteForm();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const columns = useMemo<GridColDef<EmployeeScheduleExclusionMoveT>[]>(
        () => [
            {
                field: "",
                headerName: "Actions",
                sortable: false,
                resizable: false,
                filterable: false,
                disableColumnMenu: true,
                disableReorder: true,
                width: 70,
                renderCell: ({ row }) => (
                    <Box
                        display="flex"
                        width="100%"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <ActionButton
                            title="Edit"
                            icon={<EditIcon />}
                            color="warning"
                            onClick={handleClickEditButton}
                            exclusion={row}
                            disabled={!row.can_cancel}
                        />

                        <ActionButton
                            title="Delete"
                            icon={<CloseIcon />}
                            color="error"
                            onClick={handleClickDeleteButton}
                            exclusion={row}
                            disabled={!row.can_cancel}
                        />
                    </Box>
                ),
            },
            {
                field: "weekend",
                headerName: "Weekend",
                flex: 1,
                valueGetter: (_, row) =>
                    row.weekend ? new Date(row.weekend) : null,
                valueFormatter: (_, row) =>
                    row.weekend ? formatDateHumanReadable(row.weekend) : null,
                type: "date",
            },
            {
                field: "working_day",
                headerName: "Working day",
                flex: 1,
                valueGetter: (_, row) =>
                    row.working_day ? new Date(row.working_day) : null,
                valueFormatter: (_, row) =>
                    row.working_day
                        ? formatDateHumanReadable(row.working_day)
                        : null,
                type: "date",
            },
            {
                field: "canceled",
                headerName: "Canceled",
                flex: 1,
                valueGetter: (_, row) =>
                    row.canceled ? new Date(row.canceled) : null,
                valueFormatter: (_, row) =>
                    row.canceled ? formatDateHumanReadable(row.canceled) : null,
                type: "date",
            },
        ],
        [],
    );

    return (
        <>
            <EditMovedDay
                open={editModalOpen}
                employee_id={id}
                exclusion={exclusion}
                onClose={handleCloseEditModal}
            />

            <Modal open={deleteFormOpen} onClose={handleCloseDeleteForm}>
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={2}
                >
                    <Typography fontWeight={500}>
                        Cancel exclusion?
                        {exclusion?.weekend &&
                            ` Weekend: ${formatDateHumanReadable(
                                exclusion?.weekend,
                            )}`}
                        {exclusion?.working_day &&
                            ` Working day: ${formatDateHumanReadable(
                                exclusion?.working_day,
                            )}`}
                    </Typography>

                    <Box display="flex" gap={1}>
                        <Button
                            onClick={handleCancelExclusion}
                            variant="outlined"
                        >
                            Submit
                        </Button>
                        <Button
                            onClick={handleCloseDeleteForm}
                            variant="outlined"
                            color="error"
                        >
                            Close
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <Box width="100%" height="400px">
                <DataGridPro
                    columns={columns}
                    rows={data?.payload?.items || []}
                    slots={{ toolbar: GridToolbar }}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: "weekend", sort: "asc" }],
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
                    getRowId={(row) => row.guid}
                    loading={isLoading}
                    density="compact"
                    pagination
                />
            </Box>
        </>
    );
};

export { ScheduleMoveList };
