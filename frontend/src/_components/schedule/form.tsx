import { LoadingButton } from "@mui/lab";
import { Box, Button, FormLabel, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers-pro";
import { Modal, ReduxSelect } from "_components";
import { catalogsApi, scheduleApi } from "_redux";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import {
    DayOfWeekT,
    DayT,
    DaysOfWeekT,
    EmployeeScheduleT,
    SelectOptionT,
    UpdateEmployeeScheduleT,
} from "types";
import { toastError } from "utils";
import { formatDateYYYYMMDD } from "utils/convert";
import DaysOfWeek from "./days_of_week";
import { defaultSchedule } from "./utils";

const MAX_WORKING_HOURS_PER_WEEK = 45;

interface IEditScheduleFormProps {
    id: number;
    schedule: EmployeeScheduleT | null | undefined;
    open: boolean;
    onClose: () => void;
}

const EditScheduleForm: FC<IEditScheduleFormProps> = ({
    id,
    schedule: initialSchedule,
    open,
    onClose,
}) => {
    const [schedule, setSchedule] = useState<DaysOfWeekT>(
        initialSchedule?.dow || defaultSchedule,
    );

    const [holidaySet, setHolidaySet] = useState<SelectOptionT | null>(
        initialSchedule?.holiday_set || null,
    );
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [vacationDays, setVacationDays] = useState("");
    const [individualWorkingHours, setIndividualWorkingHours] = useState("");

    const [updateEmployeeSchedule, updateEmployeeScheduleProps] =
        scheduleApi.useUpdateEmployeeScheduleMutation();

    const handleChangeStartDate = (date: Date | null) => {
        setStartDate(date);
    };

    const handleChangeSchedule = (
        dayOfWeek: DayOfWeekT,
        dayType: DayT | null,
    ) => {
        if (dayType !== null) {
            setSchedule({
                ...schedule,
                [dayOfWeek]: dayType,
            });
        }
    };

    const update = () => {
        const data: Omit<UpdateEmployeeScheduleT, "can_remove"> = {
            id,
            dow: schedule,
            start: startDate ? formatDateYYYYMMDD(startDate) : null,
            end: null,
            vacation_days_per_year: +vacationDays,
            individual_working_hours:
                individualWorkingHours.length > 0
                    ? +individualWorkingHours
                    : null,
        };

        if (holidaySet) {
            data["holiday_set"] = holidaySet;
        }

        updateEmployeeSchedule(data)
            .unwrap()
            .then(() => {
                onClose();
                toast.success("Work schedule has been successfully updated");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                display="flex"
                flexDirection="column"
                gap={1}
                alignItems="flex-start"
            >
                <Typography fontWeight={500} fontSize={20}>
                    Edit work schedule
                </Typography>

                <DaysOfWeek
                    schedule={schedule}
                    onChangeSchedule={handleChangeSchedule}
                />

                <Box display="flex" flexDirection="column">
                    <FormLabel>Start date for the updated schedule</FormLabel>
                    <DatePicker
                        value={startDate}
                        onChange={handleChangeStartDate}
                        sx={{ width: "300px", mt: "4px" }}
                    />
                </Box>

                <TextField
                    label="Vacation days per year"
                    value={vacationDays}
                    onChange={(event) => setVacationDays(event.target.value)}
                    sx={{ width: "300px" }}
                    type="number"
                    inputProps={{
                        min: 1,
                    }}
                />

                <TextField
                    label="Individual working hours per week"
                    value={individualWorkingHours}
                    onChange={(event) =>
                        setIndividualWorkingHours(event.target.value)
                    }
                    sx={{ width: "300px" }}
                    type="number"
                    inputProps={{
                        min: 1,
                        max: MAX_WORKING_HOURS_PER_WEEK,
                    }}
                />

                <Box width="300px">
                    <ReduxSelect
                        label="Holiday set"
                        value={holidaySet}
                        onChange={(value) => setHolidaySet(value)}
                        optionsLoadFn={catalogsApi.useListHolidaySetSelectQuery}
                        isClearable
                    />
                </Box>

                <Box display="flex" gap={1}>
                    <LoadingButton
                        variant="outlined"
                        onClick={update}
                        loading={updateEmployeeScheduleProps.isLoading}
                        disabled={!vacationDays || !startDate}
                    >
                        Update
                    </LoadingButton>
                    <Button variant="outlined" color="error" onClick={onClose}>
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default EditScheduleForm;
