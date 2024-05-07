import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    FormControlLabel,
    IconButton,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
    Employee,
    Modal,
    ReduxListSelectField,
    SelectPlaceholder,
} from "_components";
import { employeesApi, reportsApi, useAppSelector } from "_redux";
import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { EmployeeSelectOptionT } from "types";
import { toastError } from "utils";

interface IEditGroupProps {
    id: number | null;
    open: boolean;
    onClose: () => void;
}

const EditGroup: FC<IEditGroupProps> = ({ id, open, onClose }) => {
    const profile = useAppSelector((state) => state.profile.payload);

    const { data: group } = reportsApi.useGetGroupQuery(id!, {
        skip: !id,
    });

    const [name, setName] = useState(group?.payload?.name || "");
    const [publicGroup, setPublicGroup] = useState(
        group?.payload?.public || false,
    );
    const [selectedMembers, setSelectedMembers] = useState<
        EmployeeSelectOptionT[]
    >([]);

    const [updateMutation, { isLoading }] = reportsApi.useUpdateGroupMutation();

    const handleClickSave = () => {
        if (!group) return;
        updateMutation({ id: group.payload.id, name, public: publicGroup })
            .unwrap()
            .then(() => {
                toast.success("Group has been updated");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleClickDelete = (member: EmployeeSelectOptionT) => {
        const confirmed = confirm(
            `Are you sure you want to remove member ${member.label} from the group?`,
        );

        if (!confirmed) return;

        const newMembers = group?.payload?.members?.filter(
            (m) => m.value !== member.value,
        );

        if (!newMembers) return;
        if (!group) return;

        updateMutation({ id: group.payload.id, members: newMembers })
            .unwrap()
            .then(() => {
                toast.success(`Member ${member.label} removed from group`);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleClickAdd = () => {
        if (selectedMembers.length === 0) return;
        if (!group) return;

        updateMutation({
            id: group.payload.id,
            members: [...group.payload.members, ...selectedMembers],
        })
            .unwrap()
            .then(() => {
                setSelectedMembers([]);
                toast.success("Members added to group");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const columns: GridColDef<EmployeeSelectOptionT>[] = [
        {
            field: "value",
            headerName: "",
            sortable: false,
            filterable: false,
            width: 50,
            renderCell: ({ row }) => (
                <Box display="flex" justifyContent="center">
                    <Tooltip title="Delete member from group" placement="top">
                        <IconButton
                            onClick={() => handleClickDelete(row)}
                            color="error"
                            sx={{ p: 0 }}
                            disabled={
                                !!(
                                    group?.payload?.members?.length &&
                                    group?.payload?.members?.length < 1
                                )
                            }
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
        {
            field: "name",
            headerName: "Name",
            flex: 1,
            renderCell: ({ row }) => (
                <Employee
                    employee={{
                        id: row.value as number,
                        english_name: row.label,
                        pararam: row.pararam || "",
                    }}
                />
            ),
        },
        {
            field: "email",
            headerName: "E-mail",
            flex: 1,
        },
        { field: "pararam", headerName: "Pararam", flex: 1 },
    ];

    useEffect(() => {
        if (group) {
            setName(group.payload.name);
            setPublicGroup(group.payload.public);
        }
    }, [group]);

    return (
        <Modal open={open} onClose={onClose}>
            <Box display="flex" flexDirection="column" gap={1}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography fontWeight={500}>
                        {group?.payload?.name} - Members
                    </Typography>

                    <IconButton sx={{ p: 0 }} onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box display="flex" gap={1}>
                    <TextField
                        sx={{ flex: 1 }}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        size="small"
                    />

                    {profile.admin && (
                        <FormControlLabel
                            sx={{ ml: 1 }}
                            label="Public"
                            control={
                                <Switch
                                    checked={publicGroup}
                                    onChange={(e) =>
                                        setPublicGroup(e.target.checked)
                                    }
                                    color="info"
                                    size="small"
                                />
                            }
                        />
                    )}

                    <Tooltip title="Save name">
                        <Button
                            size="small"
                            variant="outlined"
                            color="info"
                            onClick={handleClickSave}
                        >
                            <SaveIcon />
                        </Button>
                    </Tooltip>
                </Box>

                <Box display="flex" alignItems="flex-end" gap={1}>
                    <Box flex={1}>
                        <ReduxListSelectField
                            value={selectedMembers}
                            name="employee"
                            label="Add new person"
                            // @ts-ignore
                            placeholder={<SelectPlaceholder />}
                            optionsLoadFn={
                                employeesApi.useListEmployeeSelectQuery
                            }
                            onChange={(employees) =>
                                setSelectedMembers(employees)
                            }
                            clearable
                            emptyOption
                        />
                    </Box>

                    <LoadingButton
                        onClick={handleClickAdd}
                        variant="outlined"
                        size="small"
                        color="success"
                        disabled={selectedMembers.length === 0}
                        loading={isLoading}
                    >
                        Add
                    </LoadingButton>
                </Box>

                <Box height="400px">
                    <DataGrid
                        columns={columns}
                        rows={group?.payload?.members || []}
                        getRowId={(row) => row.value}
                        density="compact"
                    />
                </Box>
            </Box>
        </Modal>
    );
};

export default EditGroup;
