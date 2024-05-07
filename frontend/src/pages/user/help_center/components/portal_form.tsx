import AddIcon from "@mui/icons-material/Add";
import { LoadingButton } from "@mui/lab";
import {
    Autocomplete,
    Box,
    Button,
    TextField,
    Typography,
} from "@mui/material";
import { Modal } from "_components";
import { helpCenterApi } from "_redux";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { NewPortalT } from "types";
import { toastError } from "utils";

import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const portalValidationSchema = yup
    .object({
        name: yup.string().required("Required field"),
        description: yup.string().required("Required field"),
        confluence_space_keys: yup.string().required("Required field"),
        youtrack_project: yup.string().required("Required field"),
    })
    .required();

const PortalForm = () => {
    const [open, setOpen] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm({ resolver: yupResolver(portalValidationSchema) });

    const [createPortal, createPortalProps] =
        helpCenterApi.useCreatePortalMutation();
    const { data: projects } =
        helpCenterApi.useListYoutrackProjectSelectQuery();
    const { data: spaceKeys } =
        helpCenterApi.useListConfluenceSpaceKeysSelectQuery({
            start: 0,
            limit: 500,
        });

    const onSubmit: SubmitHandler<NewPortalT> = (data) => {
        createPortal(data)
            .unwrap()
            .then(() => {
                setOpen(false);
                reset();
                toast.success("Portal was successfully created");
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
                Add portal
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
                    <Typography fontWeight={500}>Create portal</Typography>

                    <TextField
                        {...register("name", {
                            required: "Required field",
                        })}
                        label="Name"
                        error={!!errors.name}
                        helperText={errors.name?.message}
                    />

                    <TextField
                        {...register("description", {
                            required: "Required field",
                        })}
                        label="Description"
                        error={!!errors.description}
                        helperText={errors.description?.message}
                        multiline
                        rows={5}
                    />

                    <Autocomplete
                        options={spaceKeys || []}
                        onChange={(_, options) => {
                            setValue(
                                "confluence_space_keys",
                                options.length > 0
                                    ? options
                                          .map((option) => option.value)
                                          .join(",")
                                    : "",
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Confluence spaces"
                                error={!!errors.confluence_space_keys}
                                helperText={
                                    errors.confluence_space_keys?.message
                                }
                            />
                        )}
                        multiple
                    />

                    <Autocomplete
                        options={projects || []}
                        onChange={(_, option) =>
                            setValue(
                                "youtrack_project",
                                option?.value?.toString() || "",
                            )
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Youtrack project short name"
                                error={!!errors.youtrack_project}
                                helperText={errors.youtrack_project?.message}
                            />
                        )}
                    />

                    <Box display="flex" gap={1}>
                        <LoadingButton
                            type="submit"
                            variant="outlined"
                            size="small"
                            loading={createPortalProps.isLoading}
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

export { PortalForm };
