import CloseIcon from "@mui/icons-material/Close";
import PreviewIcon from "@mui/icons-material/Preview";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Chip,
    IconButton,
    LinearProgress,
    Tooltip,
    Typography,
} from "@mui/material";
import { DataGridPro, GridColDef } from "@mui/x-data-grid-pro";
import { nanoid } from "@reduxjs/toolkit";
import { EditButton } from "_components/buttons";
import { Modal } from "_components/modal";
import { scheduleApi, useAppSelector } from "_redux";
import { format } from "date-fns";
import React, { FC, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { EmployeeScheduleT } from "types";
import { toastError } from "utils";
import { formatDateHumanReadable } from "utils/convert";
import DaysOfWeek from "./days_of_week";
import EditScheduleForm from "./form";

const TextWithChip: FC<{ text: string; chipLabel: React.ReactNode }> = ({
    text,
    chipLabel,
}) => {
    return (
        <Box display="flex" alignItems="center" gap={1}>
            <Typography>{text}:</Typography>
            <Chip label={chipLabel} color="info" />
        </Box>
    );
};

interface IScheduleProps {
    id: number;
}

const Schedule: FC<IScheduleProps> = ({ id }) => {
    const navigate = useNavigate();

    const profile = useAppSelector((state) => state.profile.payload);

    const [editFormOpen, setEditFormOpen] = useState(false);
    const [removeScheduleModalOpen, setDeleteScheduleModalOpen] =
        useState(false);
    const [deletingSchedule, setDeletingSchedule] =
        useState<EmployeeScheduleT | null>(null);

    const { data: schedule } = scheduleApi.useGetEmployeeScheduleQuery({ id });
    const [deleteEmployeeSchedule, deleteEmployeeScheduleProps] =
        scheduleApi.useDeleteEmployeeScheduleMutation();

    const handleClickDeleteSchedule = (
        event: React.MouseEvent,
        schedule: EmployeeScheduleT,
    ) => {
        event.stopPropagation();
        setDeletingSchedule(schedule);
        setDeleteScheduleModalOpen(true);
    };

    const handleCloseDeleteScheduleModal = () => {
        setDeletingSchedule(null);
        setDeleteScheduleModalOpen(false);
    };

    const handleDeleteSchedule = () => {
        if (!deletingSchedule?.start) return;

        deleteEmployeeSchedule({ id, start: deletingSchedule.start })
            .unwrap()
            .then(() => {
                handleCloseDeleteScheduleModal();
                toast.success("Work schedule has been successfully deleted");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const canEdit = profile.hr;

    const scheduleListColumns = useMemo<GridColDef<EmployeeScheduleT>[]>(
        () => [
            {
                field: "id",
                headerName: "",
                width: 50,
                resizable: false,
                sortable: false,
                filterable: false,
                renderCell: ({ row }) => (
                    <Box
                        display="flex"
                        width="100%"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Tooltip title="Remove schedule">
                            <IconButton
                                size="small"
                                color="error"
                                onClick={(e) =>
                                    handleClickDeleteSchedule(e, row)
                                }
                                disabled={!row.can_remove}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ),
            },
            {
                field: "start",
                headerName: "Start",
                flex: 1,
                renderCell: (params) =>
                    params.row.start
                        ? format(new Date(params.row.start), "dd MMM yyyy")
                        : null,
            },
            {
                field: "end",
                headerName: "End",
                flex: 1,
                renderCell: (params) =>
                    params.row.end
                        ? format(new Date(params.row.end), "dd MMM yyyy")
                        : null,
            },
            {
                field: "vacation_days_per_year",
                headerName: "Vacation days per year",
                flex: 1,
            },
            {
                field: "holiday_set",
                headerName: "Holiday set",
                flex: 1,
                renderCell: (params) => params.row.holiday_set?.label,
            },
        ],
        [],
    );

    const { data: scheduleList, isLoading: scheduleListIsLoading } =
        scheduleApi.useListEmployeeScheduleQuery({ id });

    if (!schedule) return <LinearProgress />;

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="flex-start"
            gap={2}
        >
            <Box display="flex" alignItems="center" gap={1}>
                <Typography fontWeight={500} fontSize={20}>
                    Work schedule
                </Typography>

                {canEdit && (
                    <EditButton
                        tooltip="Edit schedule"
                        onClick={() => setEditFormOpen(true)}
                    />
                )}
            </Box>

            <EditScheduleForm
                id={id}
                schedule={schedule?.payload}
                open={editFormOpen}
                onClose={() => setEditFormOpen(false)}
            />

            <Modal
                open={removeScheduleModalOpen}
                onClose={handleCloseDeleteScheduleModal}
            >
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={1}
                >
                    <Typography fontSize={14} align="justify">
                        <Typography
                            component="span"
                            color="error"
                            fontSize="inherit"
                            fontWeight={500}
                        >
                            Warning:
                        </Typography>{" "}
                        Exclusions will not change when you delete the schedule.
                        You need to check for inconsistencies manually.
                        <br />
                        For example:
                        <br />- If someone has a holiday inside the vacation and
                        you delete this holiday this day will become a working
                        day.
                        <br />- If someone has moved a working day to a weekend
                        and the target date will become a working day because of
                        deleting the schedule, you must change the target date.
                    </Typography>

                    {deletingSchedule && (
                        <Typography>
                            {deletingSchedule.start &&
                                `Start: ${formatDateHumanReadable(
                                    deletingSchedule.start,
                                )}`}
                            {deletingSchedule.end &&
                                `- End: ${formatDateHumanReadable(
                                    deletingSchedule.end,
                                )}`}
                        </Typography>
                    )}

                    <Typography fontWeight={500}>
                        Are you sure you want to delete the work schedule?
                    </Typography>

                    <Box display="flex" gap={1}>
                        <Button
                            onClick={handleDeleteSchedule}
                            variant="outlined"
                            size="small"
                        >
                            Submit
                        </Button>
                        <LoadingButton
                            onClick={handleCloseDeleteScheduleModal}
                            loading={deleteEmployeeScheduleProps.isLoading}
                            variant="outlined"
                            size="small"
                            color="error"
                        >
                            Cancel
                        </LoadingButton>
                    </Box>
                </Box>
            </Modal>

            <Box display="flex" flexDirection="column" gap="4px">
                <TextWithChip
                    text="Start date of the work according to the current
                        schedule"
                    chipLabel={
                        schedule.payload?.start
                            ? format(
                                  new Date(schedule.payload.start),
                                  "dd MMM yyyy",
                              )
                            : "n/a"
                    }
                />

                <TextWithChip
                    text="Сurrent number of vacation days per year"
                    chipLabel={
                        schedule.payload?.vacation_days_per_year
                            ? `${schedule.payload.vacation_days_per_year} days`
                            : "n/a"
                    }
                />

                <TextWithChip
                    text="Current holiday set"
                    chipLabel={
                        schedule.payload?.holiday_set?.label ? (
                            <Box
                                onClick={() =>
                                    navigate(
                                        "/production-calendar/view/" +
                                            schedule.payload?.holiday_set
                                                ?.value,
                                    )
                                }
                                sx={{ cursor: "pointer" }}
                                display="flex"
                                alignItems="center"
                                gap={1}
                            >
                                {schedule.payload?.holiday_set?.label}

                                <PreviewIcon />
                            </Box>
                        ) : (
                            "n/a"
                        )
                    }
                />

                <TextWithChip
                    text="Individual working hours"
                    chipLabel={
                        schedule.payload?.individual_working_hours
                            ? `${schedule.payload.individual_working_hours} hours per week`
                            : "n/a"
                    }
                />
            </Box>

            {schedule.payload && (
                <DaysOfWeek schedule={schedule.payload.dow} disabled />
            )}

            <Box width="100%" height="400px">
                <DataGridPro
                    columns={scheduleListColumns}
                    rows={scheduleList?.payload?.items || []}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: "start", sort: "asc" }],
                        },
                    }}
                    loading={scheduleListIsLoading}
                    getRowId={() => nanoid()}
                    density="compact"
                    pagination
                />
            </Box>
        </Box>
    );
};

export { Schedule };
