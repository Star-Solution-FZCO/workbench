import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import { LoadingButton } from "@mui/lab";
import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import { Modal } from "_components/modal";
import { reportsApi, useAppSelector } from "_redux";
import { JSONEditorWithPreview } from "pages/user/help_center/components";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { toastError } from "utils";

const IssuesSettings = () => {
    const profile = useAppSelector((state) => state.profile.payload);

    const [open, setOpen] = useState(false);
    const [projects, setProjects] = useState<string[]>([]);

    const { data: settings } = reportsApi.useGetIssuesSettingsQuery();
    const [updateSettings, { isLoading }] =
        reportsApi.useUpdateIssuesSettingsMutation();

    const handleSave = () => {
        updateSettings({
            projects,
        })
            .unwrap()
            .then(() => {
                toast.success("Settings saved");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    useEffect(() => {
        if (settings) {
            setProjects(settings.payload.projects);
        }
    }, [settings]);

    if (!profile.admin) return null;

    return (
        <>
            <Tooltip title="Issues Settings" placement="top">
                <Button
                    onClick={() => setOpen(true)}
                    variant="outlined"
                    color="info"
                    size="small"
                >
                    <SettingsIcon />
                </Button>
            </Tooltip>

            <Modal open={open} onClose={() => setOpen(false)}>
                <Box display="flex" flexDirection="column" gap={1}>
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography variant="h6">Issues settings</Typography>

                        <IconButton onClick={() => setOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Typography fontSize={12}>Projects</Typography>

                    <JSONEditorWithPreview
                        json={projects}
                        onChange={(value) => setProjects(value)}
                    />

                    <Box display="flex" gap={1}>
                        <LoadingButton
                            onClick={handleSave}
                            type="submit"
                            size="small"
                            variant="outlined"
                            loading={isLoading}
                        >
                            Save
                        </LoadingButton>
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

export { IssuesSettings };
