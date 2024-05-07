import AddIcon from "@mui/icons-material/Add";
import { LoadingButton } from "@mui/lab";
import { Box, Button, TextField, Typography } from "@mui/material";
import { Modal, ReduxSelect } from "_components";
import { helpCenterApi } from "_redux";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { NewPortalGroupT, SelectOptionT } from "types";
import { toastError } from "utils";

const PortalGroupForm = () => {
    const [open, setOpen] = useState(false);

    const [portal, setPortal] = useState<SelectOptionT | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<NewPortalGroupT>();

    const [createPortalGroup, createPortalGroupProps] =
        helpCenterApi.useCreatePortalGroupMutation();

    const onSubmit: SubmitHandler<NewPortalGroupT> = (data) => {
        if (!portal) return;

        createPortalGroup({
            name: data.name,
            portal_id: portal.value as number,
        })
            .unwrap()
            .then(() => {
                setOpen(false);
                setPortal(null);
                reset();
                toast.success("Portal group was successfully created");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                startIcon={<AddIcon />}
                variant="outlined"
                size="small"
                color="secondary"
            >
                Add portal group
            </Button>
            <Modal open={open} onClose={() => setOpen(false)}>
                <form
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <Typography fontWeight={500}>
                        Create portal group
                    </Typography>

                    <TextField
                        {...register("name", {
                            required: "Required field",
                        })}
                        label="Name"
                        error={!!errors.name}
                        helperText={errors.name?.message}
                    />

                    <ReduxSelect
                        value={portal}
                        name="portal"
                        label="Portal"
                        optionsLoadFn={helpCenterApi.useListPortalSelectQuery}
                        onChange={(newValue) => setPortal(newValue)}
                        isClearable
                    />

                    <Box display="flex" gap={1}>
                        <LoadingButton
                            type="submit"
                            variant="outlined"
                            size="small"
                            loading={createPortalGroupProps.isLoading}
                            disabled={!portal}
                        >
                            Save
                        </LoadingButton>

                        <Button
                            color="error"
                            variant="outlined"
                            size="small"
                            onClick={() => setOpen(false)}
                        >
                            Close
                        </Button>
                    </Box>
                </form>
            </Modal>
        </>
    );
};

export { PortalGroupForm };
