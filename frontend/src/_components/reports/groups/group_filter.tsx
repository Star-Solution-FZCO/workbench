import EditIcon from "@mui/icons-material/Edit";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import SaveIcon from "@mui/icons-material/Save";
import SaveAsIcon from "@mui/icons-material/SaveAs";
import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { Modal } from "_components";
import { FormSwitchField } from "_components/fields/switch";
import { reportsApi, useAppSelector } from "_redux";
import { FC, Fragment, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { IGroup, INewGroup, SelectOptionT } from "types";
import { toastError } from "utils";
import EditGroup from "./edit_group";
import GroupManager from "./group_manager";

interface IGroupFilterProps {
    idList: Array<number | string>;
    onChangeIdList: (idList: number[]) => void;
}

const GroupFilter: FC<IGroupFilterProps> = ({ idList, onChangeIdList }) => {
    const profile = useAppSelector((state) => state.profile.payload);

    const [modalOpen, setModalOpen] = useState(false);
    const [nestedModalOpen, setNestedModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<IGroup | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [autocompleteValue, setAutocompleteValue] =
        useState<SelectOptionT | null>(null);

    const { data: groups } = reportsApi.useListGroupSelectQuery("");
    const [getGroup, { isLoading }] = reportsApi.useLazyGetGroupQuery();
    const [createGroup] = reportsApi.useCreateGroupMutation();
    const [updateMutation] = reportsApi.useUpdateGroupMutation();

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<{ name: string; public: boolean }>({
        defaultValues: {
            name: "",
            public: false,
        },
    });

    const handleCloseEditModal = () => {
        setNestedModalOpen(false);
        setSelectedGroupId(null);
    };

    const handleClickEdit = () => {
        if (!selectedGroup) return;
        setSelectedGroupId(selectedGroup.id);
        setNestedModalOpen(true);
    };

    const handleChange = (_: unknown, newValue: SelectOptionT | null) => {
        setAutocompleteValue(newValue);

        if (newValue) {
            const groupId = Number(newValue.value);

            getGroup(groupId)
                .unwrap()
                .then((res) => {
                    setSelectedGroup(res.payload);

                    const idList = res.payload.members.map(
                        (member) => member.value,
                    ) as number[];

                    onChangeIdList(idList);
                });
        } else {
            setSelectedGroup(null);
            onChangeIdList([]);
        }
    };

    const onSubmit: SubmitHandler<{ name: string; public: boolean }> = (
        formData,
    ) => {
        const data: INewGroup = {
            name: formData.name,
            members: idList.map((id) => ({
                label: "",
                value: Number(id),
            })),
            public: formData.public,
        };

        createGroup(data)
            .unwrap()
            .then(() => {
                setModalOpen(false);
                onChangeIdList([]);
                toast.success("Group was successfully created");
                reset();
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleClickSave = () => {
        if (!selectedGroup) return;

        updateMutation({
            ...selectedGroup,
            members: idList.map((id) => ({
                label: "",
                value: Number(id),
            })),
        })
            .unwrap()
            .then(() => {
                toast.success(
                    `Group "${selectedGroup.name}" has been successfully updated`,
                );
            })
            .catch((error) => {
                toastError(error);
            });
    };

    useEffect(() => {
        if (idList.length === 0) {
            setAutocompleteValue(null);
            setSelectedGroup(null);
            setSelectedGroupId(null);
        }
    }, [idList]);

    return (
        <Box
            className="reports-groups"
            display="flex"
            alignItems="center"
            gap={1}
        >
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography fontWeight={500}>
                            {selectedGroup
                                ? "Save as new group"
                                : "Create group"}
                        </Typography>

                        <TextField
                            {...register("name", {
                                required: true,
                            })}
                            label="Name"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                        />

                        {profile.admin && (
                            <FormSwitchField
                                label="Public"
                                name="public"
                                control={control}
                            />
                        )}

                        <Box display="flex" gap={1}>
                            <Button variant="outlined" type="submit">
                                Create
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => setModalOpen(false)}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Modal>

            <EditGroup
                id={selectedGroupId}
                open={nestedModalOpen}
                onClose={handleCloseEditModal}
            />

            <Autocomplete
                sx={{ width: "180px" }}
                value={autocompleteValue}
                options={groups || []}
                onChange={handleChange}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Group"
                        size="small"
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <Fragment>
                                    {isLoading ? (
                                        <CircularProgress
                                            color="inherit"
                                            size={20}
                                        />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                </Fragment>
                            ),
                        }}
                    />
                )}
            />

            {selectedGroup && selectedGroup.editable && (
                <>
                    <Tooltip title="Edit group" placement="top">
                        <Button
                            size="small"
                            variant="outlined"
                            color="info"
                            onClick={handleClickEdit}
                        >
                            <EditIcon />
                        </Button>
                    </Tooltip>
                    <Tooltip title="Save group" placement="top">
                        <Button
                            size="small"
                            variant="outlined"
                            color="info"
                            onClick={handleClickSave}
                        >
                            <SaveIcon />
                        </Button>
                    </Tooltip>
                </>
            )}

            {idList.length > 0 && (
                <Tooltip
                    title={selectedGroup ? "Save as new group" : "Create group"}
                    placement="top"
                >
                    <Button
                        size="small"
                        variant="outlined"
                        color="info"
                        onClick={() => setModalOpen(true)}
                    >
                        {selectedGroup ? <SaveAsIcon /> : <GroupAddIcon />}
                    </Button>
                </Tooltip>
            )}

            {groups?.length && groups.length > 0 ? (
                <GroupManager
                    setNestedModalOpen={setNestedModalOpen}
                    setSelectedGroupId={setSelectedGroupId}
                />
            ) : null}
        </Box>
    );
};

export { GroupFilter };
