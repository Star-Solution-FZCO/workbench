import { Box, Button, Typography } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers";
import { Hints } from "_components/calendar";
import CustomPickersDay from "_components/day_off/add_day_off/date_picker_day";
import { makeMonthRange } from "_components/day_off/add_day_off/utils";
import { Modal } from "_components/modal";
import { scheduleApi } from "_redux";
import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { EmployeeScheduleExclusionMoveT } from "types";
import { toastError } from "utils";
import { formatDateYYYYMMDD } from "utils/convert";

interface IEditMovedDayProps {
    open: boolean;
    employee_id: number;
    exclusion: EmployeeScheduleExclusionMoveT | null;
    onClose: () => void;
}

const EditMovedDay: FC<IEditMovedDayProps> = ({
    open,
    employee_id: id,
    exclusion,
    onClose,
}) => {
    const [weekendPickerCurrentMonth, setWeekendPickerCurrentMonth] =
        useState<Date>(new Date());
    const [workdayPickerCurrentMonth, setWorkdayPickerCurrentMonth] =
        useState<Date>(new Date());

    const [weekend, setWeekend] = useState<Date | null>(null);
    const [workingDay, setWorkingDay] = useState<Date | null>(null);

    const { data: weekendPickerDayStatusList } =
        scheduleApi.useGetEmployeeDayStatusListQuery({
            id,
            ...makeMonthRange(weekendPickerCurrentMonth),
        });

    const { data: workdayPickerDayStatusList } =
        scheduleApi.useGetEmployeeDayStatusListQuery({
            id,
            ...makeMonthRange(workdayPickerCurrentMonth),
        });

    const [updateExclusion] =
        scheduleApi.useUpdateMovedEmployeeScheduleExclusionMutation();

    const handleClickSave = () => {
        if (!exclusion) return;
        if (!weekend && !workingDay) return;

        updateExclusion({
            employee_id: id,
            guid: exclusion.guid,
            weekend: weekend ? formatDateYYYYMMDD(weekend) : null,
            working_day: workingDay ? formatDateYYYYMMDD(workingDay) : null,
        })
            .unwrap()
            .then(() => {
                onClose();
                toast.success("Moved day successfully updated");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    useEffect(() => {
        if (exclusion) {
            setWeekend(
                exclusion?.weekend ? new Date(exclusion?.weekend) : null,
            );
            setWorkingDay(
                exclusion?.working_day
                    ? new Date(exclusion?.working_day)
                    : null,
            );
        }
    }, [exclusion]);

    return (
        <Modal open={open} onClose={onClose}>
            <Typography variant="h6" padding="0 24px">
                Edit moved day
            </Typography>

            <Box display="flex" gap={1} mt={1}>
                <Box display="flex" gap={1}>
                    <Box className="weekend-calendar">
                        <Typography padding="0 24px" fontWeight="500">
                            Make weekend
                        </Typography>

                        <DateCalendar
                            value={weekend}
                            onMonthChange={(month: Date) =>
                                setWeekendPickerCurrentMonth(month)
                            }
                            onChange={(date) => setWeekend(date)}
                            slots={{ day: CustomPickersDay }}
                            slotProps={{
                                day: {
                                    dayStatusMap:
                                        weekendPickerDayStatusList?.payload
                                            ?.dates,
                                } as any,
                            }}
                        />

                        <Button
                            sx={{ margin: "0 24px" }}
                            onClick={() => setWeekend(null)}
                            variant="outlined"
                            size="small"
                        >
                            Clear
                        </Button>
                    </Box>

                    <Box className="work-day-calendar">
                        <Typography padding="0 24px" fontWeight="500">
                            Make work day
                        </Typography>

                        <DateCalendar
                            value={workingDay}
                            onChange={(date) => setWorkingDay(date)}
                            onMonthChange={(month: Date) =>
                                setWorkdayPickerCurrentMonth(month)
                            }
                            slots={{ day: CustomPickersDay }}
                            slotProps={{
                                day: {
                                    dayStatusMap:
                                        workdayPickerDayStatusList?.payload
                                            ?.dates,
                                } as any,
                            }}
                        />

                        <Button
                            sx={{ margin: "0 24px" }}
                            onClick={() => setWorkingDay(null)}
                            variant="outlined"
                            size="small"
                        >
                            Clear
                        </Button>
                    </Box>
                </Box>

                <Box display="flex" flexDirection="column" gap={1} py={2}>
                    <Box width="380px">
                        <Hints />
                    </Box>

                    <Button
                        onClick={handleClickSave}
                        variant="outlined"
                        size="small"
                        disabled={!weekend && !workingDay}
                    >
                        Save
                    </Button>

                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="error"
                        size="small"
                    >
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export { EditMovedDay };
