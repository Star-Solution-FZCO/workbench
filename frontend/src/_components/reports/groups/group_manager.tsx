import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GroupsIcon from "@mui/icons-material/Groups";
import PublicIcon from "@mui/icons-material/Public";
import {
    Box,
    Button,
    Divider,
    IconButton,
    Tooltip,
    Typography,
} from "@mui/material";
import { Modal, SearchField, initialListState } from "_components";
import { reportsApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { debounce } from "lodash";
import { FC, useCallback, useState } from "react";
import { toast } from "react-toastify";
import { toastError } from "utils";

interface IGroupManagerProps {
    setNestedModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedGroupId: React.Dispatch<React.SetStateAction<number | null>>;
}

const GroupManager: FC<IGroupManagerProps> = ({
    setNestedModalOpen,
    setSelectedGroupId,
}) => {
    const [open, setOpen] = useState(false);

    const [listState, setListState] = useState(initialListState);

    const { data: groups } = reportsApi.useListGroupQuery(
        makeListParams(listState, ["name___icontains"]),
    );

    const [deleteGroup] = reportsApi.useDeleteGroupMutation();

    const handleClickEdit = (id: number) => {
        setSelectedGroupId(id);
        setNestedModalOpen(true);
    };

    const handleClickDelete = (id: number, name: string) => {
        const confirmed = confirm(
            `Are you sure you want to delete the "${name}" group?`,
        );

        if (!confirmed) return;

        deleteGroup(id)
            .unwrap()
            .then(() => {
                toast.success("Group was successfully deleted");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const search = (event: React.ChangeEvent<HTMLInputElement>) => {
        setListState({
            ...listState,
            search: event.target.value,
        });
    };

    const handleChangeSearch = useCallback(debounce(search, 300), []);

    return (
        <>
            <Tooltip title="Manage groups" placement="top">
                <Button
                    variant="outlined"
                    size="small"
                    color="info"
                    onClick={() => setOpen(true)}
                >
                    <GroupsIcon />
                </Button>
            </Tooltip>

            <Modal open={open} onClose={() => setOpen(false)}>
                <Box display="flex" flexDirection="column" gap={1}>
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography fontWeight={500}>Group manager</Typography>

                        <IconButton
                            sx={{ p: 0 }}
                            onClick={() => setOpen(false)}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <SearchField onChange={handleChangeSearch} />

                    <Divider />

                    <Box
                        display="flex"
                        flexDirection="column"
                        overflow="auto"
                        gap={1}
                    >
                        {groups?.payload.items?.length &&
                        groups?.payload.items?.length > 0 ? (
                            groups?.payload?.items?.map((group) => (
                                <Box
                                    key={group.id}
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    width="100%"
                                >
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={0.5}
                                    >
                                        <Typography>{group.name}</Typography>

                                        {group.public && (
                                            <Tooltip
                                                title="Public"
                                                placement="top"
                                            >
                                                <PublicIcon color="info" />
                                            </Tooltip>
                                        )}
                                    </Box>

                                    {group.editable && (
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            gap="4px"
                                        >
                                            <IconButton
                                                sx={{ p: 0 }}
                                                onClick={() =>
                                                    handleClickEdit(group.id)
                                                }
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                sx={{ p: 0 }}
                                                onClick={() =>
                                                    handleClickDelete(
                                                        group.id,
                                                        group.name,
                                                    )
                                                }
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>
                            ))
                        ) : (
                            <Typography>No groups</Typography>
                        )}
                    </Box>

                    <Divider />

                    {groups?.payload && (
                        <Typography fontSize={14}>
                            Total groups: {groups.payload.items.length}
                        </Typography>
                    )}
                </Box>
            </Modal>
        </>
    );
};

export default GroupManager;
