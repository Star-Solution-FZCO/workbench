import { TabContext, TabList, TabPanel } from "@mui/lab";
import {
    Box,
    Button,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Tab,
    Typography,
} from "@mui/material";
import {
    DateCalendar,
    DateRange,
    StaticDateRangePicker,
} from "@mui/x-date-pickers-pro";
import { useTour } from "@reactour/tour";
import { Modal, Pointer } from "_components";
import YearPicker from "_components/calendar/year_picker";
import { scheduleApi, useAppSelector } from "_redux";
import { capitalize } from "lodash";
import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { toastError } from "utils";
import { formatDateYYYYMMDD } from "utils/convert";
import { Hints } from "../../calendar/calendar";
import CustomPickersDay from "./date_picker_day";
import CustomDateRangePickerDay from "./date_range_picker_day";
import { makeMonthRange } from "./utils";

const tabs = ["day_off", "move_work_day"] as const;
const dayOffTypes = ["vacation", "sick_day", "business_trip"] as const;

type TabT = (typeof tabs)[number];
type DayOffT = (typeof dayOffTypes)[number];

interface IAddDayOffProps {
    employee_id: number;
}

const AddDayOff: FC<IAddDayOffProps> = ({ employee_id: id }) => {
    const { isOpen: tourOpen, currentStep, setCurrentStep } = useTour();
    const userRoles = useAppSelector((state) => state.profile.payload.roles);

    const [open, setOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState<TabT>("day_off");

    const [dayOffType, setDayOffType] = useState<DayOffT>("vacation");

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const [rangeCurrentMonth, setRangeCurrentMonth] = useState<Date>(
        new Date(),
    );
    const [weekendPickerCurrentMonth, setWeekendPickerCurrentMonth] =
        useState<Date>(new Date());
    const [workdayPickerCurrentMonth, setWorkdayPickerCurrentMonth] =
        useState<Date>(new Date());

    const [weekend, setWeekend] = useState<Date | null>(null);
    const [workingDay, setWorkingDay] = useState<Date | null>(null);

    const [saveButtonDisabled, setSaveButtonDisabled] = useState(true);

    const [createEmployeeScheduleExclusion] =
        scheduleApi.useCreateEmployeeScheduleExclusionMutation();
    const [moveEmployeeScheduleExclusion] =
        scheduleApi.useMoveEmployeeScheduleExclusionMutation();

    const { data: monthRangeDayStatusList } =
        scheduleApi.useGetEmployeeDayStatusListQuery({
            id,
            ...makeMonthRange(rangeCurrentMonth, 2),
        });

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

    const closeWindow = () => {
        setOpen(false);
        setWeekend(null);
        setWorkingDay(null);
        setStartDate(null);
        setEndDate(null);
    };

    const handleTabChange = (_: React.SyntheticEvent, value: TabT) => {
        setCurrentTab(value);
        if (tourOpen && currentStep === 16) {
            setCurrentStep(17);
        }
    };

    const handleChangeDayOffType = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setDayOffType((event.target as HTMLInputElement).value as DayOffT);
    };

    const handleChangeRange = (range: DateRange<Date>) => {
        if (!startDate && !endDate) {
            setStartDate(range[0] || range[1]);
            setEndDate(range[0] || range[1]);
            return;
        }
        setStartDate(range[0]);
        setEndDate(range[1]);
    };

    const submitCreateExclusion = () => {
        if (!startDate || !endDate) return;

        createEmployeeScheduleExclusion({
            id,
            exclusion: {
                start: formatDateYYYYMMDD(startDate),
                end: formatDateYYYYMMDD(endDate),
                type: dayOffType,
            },
        })
            .unwrap()
            .then(() => {
                closeWindow();
                toast.success("Schedule exclusion successfully created");
            })
            .catch((error: unknown) => {
                toastError(error);
            });
    };

    const submitMoveExclusion = () => {
        if (!weekend && !workingDay) return;

        moveEmployeeScheduleExclusion({
            employee_id: id,
            weekend: weekend ? formatDateYYYYMMDD(weekend) : null,
            working_day: workingDay ? formatDateYYYYMMDD(workingDay) : null,
        })
            .unwrap()
            .then(() => {
                closeWindow();
                toast.success("Schedule exclusion successfully moved");
            })
            .catch((error: unknown) => {
                toastError(error);
            });
    };

    const save = () => {
        if (currentTab === "day_off") {
            submitCreateExclusion();
            return;
        }

        if (currentTab === "move_work_day") {
            submitMoveExclusion();
            return;
        }
    };

    useEffect(() => {
        if (currentTab === "day_off") {
            setSaveButtonDisabled(!startDate || !endDate);
        }
        if (currentTab === "move_work_day") {
            setSaveButtonDisabled(!weekend && !workingDay);
        }
    }, [currentTab, startDate, endDate, weekend, workingDay]);

    useEffect(() => {
        if (tourOpen) {
            setOpen(currentStep > 7 && currentStep < 21);
            setCurrentTab(currentStep > 16 ? "move_work_day" : "day_off");
        }
    }, [tourOpen, currentStep]);

    return (
        <>
            <Pointer show={currentStep === 7}>
                <Button
                    className="add-day-off-button"
                    onClick={() => {
                        setOpen(true);
                        if (tourOpen) {
                            setCurrentStep(8);
                        }
                    }}
                    sx={{
                        height: "56px",
                    }}
                    variant="outlined"
                    fullWidth
                >
                    Add vacation/sick day/business trip
                    <br />
                    Move work day
                </Button>
            </Pointer>

            <Modal
                className="add-day-off-modal"
                open={open}
                onClose={closeWindow}
            >
                <TabContext value={currentTab}>
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <TabList onChange={handleTabChange}>
                            <Tab
                                className="day-off-tab"
                                label="Day off"
                                value="day_off"
                            />

                            <Tab
                                className="move-work-day-tab"
                                label="Move work day"
                                value="move_work_day"
                            />
                        </TabList>
                    </Box>

                    <Box display="flex" gap={2}>
                        <TabPanel
                            value="day_off"
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                                p: 0,
                            }}
                        >
                            <Box className="year-picker" pl={3} pt={2}>
                                <YearPicker
                                    year={rangeCurrentMonth}
                                    onChange={(value) => {
                                        value && setRangeCurrentMonth(value);
                                        setStartDate(value);
                                        setEndDate(value);
                                    }}
                                />
                            </Box>

                            <StaticDateRangePicker
                                className="date-range-picker"
                                value={[startDate, endDate]}
                                onChange={handleChangeRange}
                                onMonthChange={(month) =>
                                    setRangeCurrentMonth(month)
                                }
                                slots={{ day: CustomDateRangePickerDay }}
                                slotProps={{
                                    day: {
                                        dayStatusMap:
                                            monthRangeDayStatusList?.payload
                                                ?.dates,
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    } as any,
                                    actionBar: { actions: ["clear"] },
                                }}
                                calendars={2}
                            />
                        </TabPanel>

                        <TabPanel value="move_work_day" sx={{ p: 0 }}>
                            <Box display="flex" gap={1} pt={2}>
                                <Box className="weekend-calendar">
                                    <Typography
                                        padding="0 24px"
                                        fontWeight="500"
                                    >
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
                                                    weekendPickerDayStatusList
                                                        ?.payload?.dates,
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                                    <Typography
                                        padding="0 24px"
                                        fontWeight="500"
                                    >
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
                                                    workdayPickerDayStatusList
                                                        ?.payload?.dates,
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                        </TabPanel>

                        <Box
                            display="flex"
                            flexDirection="column"
                            gap={1}
                            py={2}
                        >
                            <Box width="380px">
                                <Hints />
                            </Box>

                            {currentTab === "day_off" && (
                                <FormControl className="day-off-types">
                                    <FormLabel>Select day off</FormLabel>
                                    <RadioGroup
                                        value={dayOffType}
                                        onChange={handleChangeDayOffType}
                                    >
                                        {dayOffTypes.map((dot) => (
                                            <FormControlLabel
                                                key={dot}
                                                value={dot}
                                                control={<Radio />}
                                                label={capitalize(
                                                    dot.split("_").join(" "),
                                                )}
                                            />
                                        ))}

                                        {userRoles?.includes("super_hr") && (
                                            <FormControlLabel
                                                value="unpaid_leave"
                                                control={<Radio />}
                                                label="Unpaid leave"
                                            />
                                        )}
                                    </RadioGroup>
                                </FormControl>
                            )}

                            <Button
                                className="add-day-off-modal-save-button"
                                onClick={save}
                                variant="outlined"
                                size="small"
                                disabled={saveButtonDisabled}
                            >
                                Save
                            </Button>

                            <Button
                                onClick={closeWindow}
                                variant="outlined"
                                color="error"
                                size="small"
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                </TabContext>
            </Modal>
        </>
    );
};

export { AddDayOff };
