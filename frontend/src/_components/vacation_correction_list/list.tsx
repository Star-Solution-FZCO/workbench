import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import { DataGridPro, GridColDef, GridToolbar } from "@mui/x-data-grid-pro";
import { nanoid } from "@reduxjs/toolkit";
import { Employee, Modal } from "_components";
import { scheduleApi } from "_redux";
import { FC, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { EmployeeVacationCorrectionT } from "types";
import { toastError } from "utils";
import { formatDateHumanReadable } from "utils/convert";

interface IVacationCorrectionListProps {
    employee_id: number;
}

interface IDeleteButtonProps {
    obj: EmployeeVacationCorrectionT;
    onClick: (obj: EmployeeVacationCorrectionT) => void;
    disabled?: boolean;
}

const DeleteButton: FC<IDeleteButtonProps> = ({ obj, onClick, disabled }) => {
    return (
        <Tooltip title="Delete">
            <IconButton
                size="small"
                color="error"
                onClick={() => onClick(obj)}
                disabled={disabled}
            >
                <CloseIcon />
            </IconButton>
        </Tooltip>
    );
};

const VacationCorrectionList: FC<IVacationCorrectionListProps> = ({
    employee_id: id,
}) => {
    const [deleteFormOpen, setDeleteFormOpen] = useState(false);
    const [correction, setCorrection] =
        useState<EmployeeVacationCorrectionT | null>(null);

    const { data, isLoading } =
        scheduleApi.useListEmployeeVacationCorrectionQuery({
            id,
        });
    const [deleteCorrection] =
        scheduleApi.useDeleteEmployeeVacationCorrectionMutation();

    const handleCloseDeleteForm = () => {
        setDeleteFormOpen(false);
        setCorrection(null);
    };

    const handleClickDeleteButton = (
        exclusion: EmployeeVacationCorrectionT,
    ) => {
        setDeleteFormOpen(true);
        setCorrection(exclusion);
    };

    const handleDeleteCorrection = () => {
        if (!correction) return;
        deleteCorrection({ employee_id: id, id: correction.id })
            .unwrap()
            .then(() => {
                toast.success("Correction has been successfully deleted");
                handleCloseDeleteForm();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const columns = useMemo<GridColDef<EmployeeVacationCorrectionT>[]>(
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
                        <DeleteButton
                            onClick={handleClickDeleteButton}
                            obj={row}
                            disabled={!row.can_delete}
                        />
                    </Box>
                ),
            },
            {
                field: "created",
                headerName: "Created",
                flex: 1,
                valueGetter: (_, row) => new Date(row.created),
                valueFormatter: (_, row) =>
                    formatDateHumanReadable(row.created),
                type: "date",
            },
            {
                field: "days",
                headerName: "Days",
                flex: 1,
            },
            {
                field: "description",
                headerName: "Description",
                flex: 1,
            },
            {
                field: "created_by",
                headerName: "Created by",
                flex: 1,
                renderCell: ({ row }) =>
                    row.created_by && <Employee employee={row.created_by} />,
            },
        ],
        [],
    );

    return (
        <>
            <Modal open={deleteFormOpen} onClose={handleCloseDeleteForm}>
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={2}
                >
                    <Typography fontWeight={500}>
                        Delete correction ({correction?.days} days)?
                    </Typography>

                    <Box display="flex" gap={1}>
                        <Button
                            onClick={handleDeleteCorrection}
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
                            sortModel: [{ field: "created", sort: "asc" }],
                        },
                    }}
                    getRowId={() => nanoid()}
                    loading={isLoading}
                    density="compact"
                    pagination
                />
            </Box>
        </>
    );
};

export { VacationCorrectionList };
