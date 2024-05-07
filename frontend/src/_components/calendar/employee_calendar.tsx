import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Tab,
} from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import {
    AddDayOff,
    DayOffList,
    ScheduleMoveList,
    VacationCorrectionList,
} from "_components";
import {
    employeesApi,
    scheduleApi,
    setDisplayingCalendarMonths,
    useAppDispatch,
    useAppSelector,
} from "_redux";
import { FC, useState } from "react";
import { useMatch } from "react-router-dom";
import { Hints } from "./calendar";
import { makeYearRange } from "./calendar/utils";
import { CalendarMonthTable } from "./calendar_month_table";
import { FreeVacationDays } from "./free_vacation_days";
import { makeMonthRange } from "./utils";
import YearPicker from "./year_picker";

interface IEmployeeCalendarProps {
    id: number;
}

const addYears = (date: Date, years: number): Date => {
    const newDate = new Date(date);
    newDate.setFullYear(newDate.getFullYear() + years);
    return newDate;
};

const EmployeeCalendar: FC<IEmployeeCalendarProps> = ({ id }) => {
    const dispatch = useAppDispatch();

    const isMyCalendarPage = useMatch("/my-calendar");

    const profile = useAppSelector((state) => state.profile.payload);
    const numberOfDisplayingMonths = useAppSelector(
        (state) => state.shared.displayingCalendarMonths,
    );

    const { data: employee } = employeesApi.useGetEmployeeQuery({ id });

    const [currentTab, setCurrentTab] = useState("day_off_list");
    const [year, setYear] = useState<Date>(new Date());
    const [months, setMonths] = useState<number[]>(
        makeMonthRange(numberOfDisplayingMonths),
    );

    const canAddDayOff =
        profile.hr ||
        employee?.payload?.is_current_user_manager ||
        employee?.payload?.is_current_user_team_lead ||
        profile.id === id;

    const {
        data: dayStatusItems,
        isLoading,
        isFetching,
    } = scheduleApi.useGetEmployeeDayStatusListQuery({
        id,
        ...makeYearRange(year),
    });

    const handleChangeYear = (value: Date | null) => {
        if (!value) return;
        setYear(value);
    };

    const handleChangeNumberOfMonths = (event: SelectChangeEvent<number>) => {
        const numberOfMonths = event.target.value as number;
        dispatch(setDisplayingCalendarMonths(numberOfMonths));
        setMonths(makeMonthRange(numberOfMonths));
    };

    const handleClickBack = () => {
        if (!year) return;

        const newMonths = months.map((m) => {
            const res = m - numberOfDisplayingMonths;
            return res >= 0 ? res : res + 12;
        });

        if (months.includes(0) && months.includes(11)) {
            const prevYear = addYears(year, -1);
            setYear(prevYear);
        }

        setMonths(newMonths);
    };

    const handleClickForward = () => {
        if (!year) return;

        const newMonths = months.map(
            (m) => (m + numberOfDisplayingMonths) % 12,
        );

        if (newMonths.includes(11) && newMonths.includes(0)) {
            const nextYear = addYears(year, 1);
            setYear(nextYear);
        }

        setMonths(newMonths);
    };

    return (
        <Box display="flex" flexDirection="column" gap="16px">
            <FreeVacationDays id={id} showTrainingButton={!!isMyCalendarPage} />

            <Box display="flex" gap="8px">
                <Hints showCurrentMonthHint />

                <Box
                    className="calendar-controls"
                    display="flex"
                    flexDirection="column"
                    gap="12px"
                >
                    <YearPicker
                        key={nanoid()}
                        year={year}
                        onChange={handleChangeYear}
                    />

                    <FormControl>
                        <InputLabel>Displayed number of months</InputLabel>
                        <Select
                            value={numberOfDisplayingMonths}
                            label="Displayed number of months"
                            onChange={handleChangeNumberOfMonths}
                        >
                            <MenuItem value={4}>4</MenuItem>
                            <MenuItem value={12}>12</MenuItem>
                        </Select>
                    </FormControl>

                    {canAddDayOff && <AddDayOff employee_id={id} />}
                </Box>
            </Box>

            <Box display="flex" gap={1}>
                <Button
                    sx={{ p: 0, width: "40px", minWidth: 0 }}
                    onClick={handleClickBack}
                    color="info"
                    variant="outlined"
                >
                    <ArrowBackIosNewIcon />
                </Button>

                <CalendarMonthTable
                    year={year}
                    months={months}
                    dayStatusMap={dayStatusItems?.payload?.dates}
                    loading={isLoading || isFetching}
                />

                <Button
                    sx={{ p: 0, width: "40px", minWidth: 0 }}
                    onClick={handleClickForward}
                    color="info"
                    variant="outlined"
                    size="small"
                >
                    <ArrowForwardIosIcon />
                </Button>
            </Box>

            <Box
                className="day-off-list"
                border={1}
                borderColor="divider"
                borderRadius={1}
            >
                <TabContext value={currentTab}>
                    <Box
                        sx={{ borderBottom: 1, borderColor: "divider", mt: 1 }}
                    >
                        <TabList onChange={(_, value) => setCurrentTab(value)}>
                            <Tab label="Day off list" value="day_off_list" />
                            <Tab
                                label="Vacation correction list"
                                value="vacation_correction_list"
                            />
                            <Tab
                                label="Moved days list"
                                value="moved_days_list"
                            />
                        </TabList>
                    </Box>

                    <TabPanel value="day_off_list" sx={{ px: 0, py: 1 }}>
                        <DayOffList employee_id={id} />
                    </TabPanel>

                    <TabPanel
                        value="vacation_correction_list"
                        sx={{ px: 0, py: 1 }}
                    >
                        <VacationCorrectionList employee_id={id} />
                    </TabPanel>

                    <TabPanel value="moved_days_list" sx={{ px: 0, py: 1 }}>
                        <ScheduleMoveList employee_id={id} />
                    </TabPanel>
                </TabContext>
            </Box>
        </Box>
    );
};

export { EmployeeCalendar };
