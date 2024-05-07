import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import {
    Box,
    IconButton,
    IconButtonPropsColorOverrides,
    Tooltip,
} from "@mui/material";
import { OverridableStringUnion } from "@mui/types";
import { DataGridPro, GridColDef, GridToolbar } from "@mui/x-data-grid-pro";
import { Employee } from "_components";
import { scheduleApi } from "_redux";
import { capitalize } from "lodash";
import React, { FC, useMemo, useState } from "react";
import { EmployeeScheduleExclusionT } from "types";
import { formatDateHumanReadable } from "utils/convert";
import ActionForm from "./form";
import { ActionT } from "./utils";

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
    exclusion: EmployeeScheduleExclusionT;
    action: ActionT;
    onClick: (exclusion: EmployeeScheduleExclusionT, action: ActionT) => void;
    disabled?: boolean;
}

const ActionButton: FC<IActionButtonProps> = ({
    title,
    icon,
    color,
    exclusion,
    action,
    onClick,
    disabled,
}) => {
    return (
        <Tooltip title={title}>
            <IconButton
                size="small"
                color={color}
                onClick={() => onClick(exclusion, action)}
                disabled={disabled}
            >
                {icon}
            </IconButton>
        </Tooltip>
    );
};

interface IDayOffListProps {
    employee_id: number;
}

const DayOffList: FC<IDayOffListProps> = ({ employee_id: id }) => {
    const [actionFormOpen, setActionFormOpen] = useState(false);
    const [action, setAction] = useState<ActionT | null>(null);
    const [exclusion, setExclusion] =
        useState<EmployeeScheduleExclusionT | null>(null);

    const { data, isLoading } =
        scheduleApi.useGetEmployeeScheduleExclusionGroupedListQuery({ id });

    const handleCloseActionForm = () => {
        setActionFormOpen(false);
        setExclusion(null);
        setAction(null);
    };

    const handleClickActionButton = (
        exclusion: EmployeeScheduleExclusionT,
        action: ActionT,
    ) => {
        setAction(action);
        setExclusion(exclusion);
        setActionFormOpen(true);
    };

    const columns = useMemo<GridColDef<EmployeeScheduleExclusionT>[]>(
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
                            title="Exclude day"
                            icon={<EditIcon />}
                            color="warning"
                            exclusion={row}
                            action="exclusion"
                            onClick={handleClickActionButton}
                            disabled={!row.can_cancel}
                        />

                        <ActionButton
                            title="Cancel"
                            icon={<CloseIcon />}
                            color="error"
                            exclusion={row}
                            action="cancellation"
                            onClick={handleClickActionButton}
                            disabled={!row.can_cancel}
                        />
                    </Box>
                ),
            },
            {
                field: "type",
                headerName: "Type",
                flex: 1,
                valueGetter: (_, row) =>
                    capitalize(row.type.split("_").join(" ")),
            },
            {
                field: "days",
                headerName: "Number of days",
                flex: 1,
            },
            {
                field: "start",
                headerName: "Start date",
                flex: 1,
                valueGetter: (_, row) => new Date(row.start),
                valueFormatter: (_, row) => formatDateHumanReadable(row.start),
                type: "date",
            },
            {
                field: "end",
                headerName: "End date",
                flex: 1,
                valueGetter: (_, row) => new Date(row.end),
                valueFormatter: (_, row) => formatDateHumanReadable(row.end),
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
            {
                field: "canceled_by",
                headerName: "Canceled by",
                flex: 1,
                renderCell: ({ row }) =>
                    row.canceled_by && <Employee employee={row.canceled_by} />,
            },
        ],
        [],
    );

    return (
        <>
            <ActionForm
                employee_id={id}
                exclusion={exclusion}
                action={action}
                open={actionFormOpen}
                onClose={handleCloseActionForm}
            />

            <Box width="100%" height="400px">
                <DataGridPro
                    columns={columns}
                    rows={data?.payload?.items || []}
                    slots={{ toolbar: GridToolbar }}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: "start", sort: "asc" }],
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

export { DayOffList };
