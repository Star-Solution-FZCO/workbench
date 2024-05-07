import { yupResolver } from "@hookform/resolvers/yup";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import {
    Box,
    Button,
    IconButton,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers";
import { Modal } from "_components";
import { requestsApi, useAppSelector } from "_redux";
import { format } from "date-fns";
import { JSONEditorWithPreview } from "pages/user/help_center/components";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { YouTrackProjectSettingsT } from "types";
import { HHmmToDate, toastError } from "utils";

import * as yup from "yup";

const settingsSchema = yup
    .object({
        work_start: yup.date().required("Required field"),
        work_end: yup.date().required("Required field"),
        duration: yup.number().required("Required field").min(1),
        max_number_parallel_meetings: yup
            .number()
            .required("Required field")
            .min(1),
        calendar_ids: yup.array().of(yup.string().required()).optional(),
        youtrack_projects: yup
            .array()
            .of(
                yup.object({
                    short_name: yup.string().required(),
                    main: yup.boolean().required(),
                    tags: yup.array().of(yup.string().required()).required(),
                }),
            )
            .required("Required field"),
        unavailability_label: yup.string().required("Required field"),
        chat_id: yup.string().required("Required field"),
        content: yup.string().nullable(),
    })
    .required();

type FormData = yup.InferType<typeof settingsSchema>;

const EmployeeRequestSettings = () => {
    const profile = useAppSelector((state) => state.profile.payload);

    const [open, setOpen] = useState(false);
    const [calendarIds, setCalendarIds] = useState<string[]>([]);
    const [youTrackProjects, setYouTrackProjects] = useState<
        YouTrackProjectSettingsT[]
    >([]);

    const { data } = requestsApi.useGetEmployeeRequestSettingsQuery();
    const [updateSettings] =
        requestsApi.useUpdateEmployeeRequestSettingsMutation();

    const {
        register,
        getValues,
        setValue,
        reset,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(settingsSchema),
    });

    const onSubmit = (formData: FormData) => {
        const data = {
            ...formData,
            calendar_ids: calendarIds,
            youtrack_projects: youTrackProjects,
            work_start: format(formData.work_start, "HH:mm"),
            work_end: format(formData.work_end, "HH:mm"),
        };

        updateSettings(data)
            .unwrap()
            .then(() => {
                setOpen(false);
                toast.success("Settings have been updated successfully");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    useEffect(() => {
        if (data) {
            reset({
                ...data.payload,
                work_start: HHmmToDate(data.payload.work_start),
                work_end: HHmmToDate(data.payload.work_end),
            });
            setCalendarIds(data.payload.calendar_ids);
            setYouTrackProjects(data.payload.youtrack_projects);
        }
    }, [data, reset]);

    return (
        <>
            {profile.admin && (
                <Tooltip title="Settings" placement="top">
                    <Button
                        onClick={() => setOpen(true)}
                        variant="outlined"
                        size="small"
                        color="success"
                    >
                        <SettingsIcon />
                    </Button>
                </Tooltip>
            )}

            <Modal open={open} onClose={() => setOpen(false)} fullHeight>
                <Box
                    component="form"
                    display="flex"
                    flexDirection="column"
                    gap={1}
                    height="100%"
                    overflow="auto"
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography variant="h6">Settings</Typography>

                        <IconButton onClick={() => setOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box display="flex" gap={1}>
                        <TimePicker
                            label="Work start (UTC)"
                            value={getValues("work_start")}
                            onChange={(value) => {
                                // @ts-ignore
                                setValue("work_start", value);
                            }}
                            slotProps={{
                                textField: {
                                    helperText: errors.work_start?.message,
                                    error: !!errors.work_start,
                                },
                            }}
                        />
                        <TimePicker
                            label="Work end (UTC)"
                            value={getValues("work_end")}
                            onChange={(value) => {
                                // @ts-ignore
                                setValue("work_end", value);
                            }}
                            slotProps={{
                                textField: {
                                    helperText: errors.work_end?.message,
                                    error: !!errors.work_end,
                                },
                            }}
                        />
                    </Box>

                    <Typography fontSize={12}>Calendar IDs</Typography>

                    <JSONEditorWithPreview
                        json={calendarIds}
                        onChange={(value) => setCalendarIds(value)}
                    />

                    <Typography fontSize={12}>YouTrack projects</Typography>

                    <JSONEditorWithPreview
                        json={youTrackProjects}
                        onChange={(value) => setYouTrackProjects(value)}
                    />

                    <TextField
                        {...register("chat_id")}
                        label="Pararam chat ID for notifications"
                        error={!!errors.chat_id}
                        helperText={errors.chat_id?.message}
                    />
                    <TextField
                        {...register("unavailability_label")}
                        label="Unavailability label"
                        error={!!errors.unavailability_label}
                        helperText={errors.unavailability_label?.message}
                    />

                    <Box display="flex" gap={1}>
                        <TextField
                            {...register("duration")}
                            label="Onboarding duration in hours"
                            type="number"
                            error={!!errors.duration}
                            helperText={errors.duration?.message}
                            fullWidth
                        />
                        <TextField
                            {...register("max_number_parallel_meetings")}
                            label="Maximum number of parallel meetings"
                            type="number"
                            error={!!errors.max_number_parallel_meetings}
                            helperText={
                                errors.max_number_parallel_meetings?.message
                            }
                            fullWidth
                        />
                    </Box>

                    <TextField
                        {...register("content")}
                        label="Content for calendar event description (optional)"
                        error={!!errors.content}
                        helperText={errors.content?.message}
                        multiline
                        rows={3}
                    />

                    <Box display="flex" gap={1}>
                        <Button type="submit" size="small" variant="outlined">
                            Save
                        </Button>
                        <Button
                            onClick={() => {
                                setOpen(false);
                            }}
                            size="small"
                            variant="outlined"
                            color="error"
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export { EmployeeRequestSettings };
