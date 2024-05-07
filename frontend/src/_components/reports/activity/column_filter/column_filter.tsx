import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import {
    Box,
    Button,
    FormControlLabel,
    Switch,
    Tooltip,
    Typography,
} from "@mui/material";
import { useTour } from "@reactour/tour";
import { Modal, Pointer } from "_components";
import {
    setActivityReportColumns,
    useAppDispatch,
    useAppSelector,
} from "_redux";
import clsx from "clsx";
import { activityReportColumnMap } from "config";
import { mapValues } from "lodash";
import { useEffect, useState } from "react";
import { ActivityReportColumnT } from "types";
import "./column_filter.css";

const ActivityColumnFilter = () => {
    const dispatch = useAppDispatch();
    const { isOpen: tourOpen, setCurrentStep, currentStep } = useTour();

    const settingsFromState = useAppSelector(
        (state) => state.shared.activityReportColumns,
    );

    const [open, setOpen] = useState(false);
    const [settings, setSettings] =
        useState<Record<ActivityReportColumnT, boolean>>(settingsFromState);

    const handleChange = (key: ActivityReportColumnT, checked: boolean) => {
        setSettings({
            ...settings,
            [key]: checked,
        });
    };

    const changeAll = () => {
        const newSettings = mapValues(settings, () =>
            Object.values(settings).some((c) => !c),
        );
        setSettings(newSettings);
    };

    const save = () => {
        dispatch(setActivityReportColumns(settings));
        setOpen(false);
    };

    useEffect(() => {
        if (tourOpen) {
            setOpen(currentStep === 5);
        }
    }, [tourOpen, currentStep]);

    return (
        <>
            <Tooltip title="Manage report columns" placement="top">
                <Pointer show={currentStep === 4}>
                    <Button
                        className={clsx("activity-column-filter-button", {
                            "activity-column-filter-button_hightlighted":
                                currentStep === 4,
                        })}
                        onClick={() => {
                            setOpen(true);
                            tourOpen && setCurrentStep(5);
                        }}
                        variant="outlined"
                        size="small"
                        color="info"
                    >
                        <ViewColumnIcon />
                    </Button>
                </Pointer>
            </Tooltip>

            <Modal open={open} onClose={() => setOpen(false)}>
                <Box
                    className="activity-column-filter"
                    display="flex"
                    flexDirection="column"
                    gap={1}
                >
                    <Typography fontWeight={500}>
                        Manage report columns
                    </Typography>

                    <Box display="flex" flexDirection="column" gap={1}>
                        {activityReportColumnMap.map((record) => (
                            <FormControlLabel
                                key={record.key}
                                control={
                                    <Switch
                                        checked={settings[record.key]}
                                        onChange={(e) =>
                                            handleChange(
                                                record.key,
                                                e.target.checked,
                                            )
                                        }
                                        color="info"
                                        size="small"
                                    />
                                }
                                label={record.label}
                            />
                        ))}
                    </Box>

                    <Box display="flex" gap={1}>
                        <Button onClick={save} variant="outlined" size="small">
                            Save
                        </Button>

                        <Button
                            onClick={changeAll}
                            color="secondary"
                            variant="outlined"
                            size="small"
                        >
                            Check/Uncheck all
                        </Button>
                        <Button
                            onClick={() => setOpen(false)}
                            variant="outlined"
                            size="small"
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

export { ActivityColumnFilter };
