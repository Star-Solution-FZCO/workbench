import FlagIcon from "@mui/icons-material/Flag";
import { Box, Button, Typography } from "@mui/material";
import { StepType } from "@reactour/tour";
import { FC } from "react";
import { Onboarding } from "./onboarding";

const steps: StepType[] = [
    // @ts-ignore
    {
        content:
            "Welcome to My Calendar page 👋 To learn how to work with calendar, go to the next step",
        position: "center",
    },
    {
        selector: ".free-vacation-days",
        content:
            "This section displays information about the number of your vacation days for the whole year and the accumulated vacation days for today",
    },
    {
        selector: ".vacation-balance-hint",
        content:
            "There may be situations when you have a negative balance of vacation days. To get an explanation, click on the hint",
        disableActions: true,
    },
    {
        selector: ".vacation-balance-explanation",
        content:
            "It is highly recommended to read the explanation. After reading the explanation, proceed to the next step",
        disableActions: false,
    },
    {
        selector: ".work-calendar",
        content: "Your work calendar ☺️",
    },
    {
        selector: ".calendar-hints",
        content: "Hints with a note for different day types are displayed here",
    },
    {
        selector: ".calendar-controls",
        content:
            "You can switch between years, change the number of displayed months",
    },
    {
        selector: ".add-day-off-button",
        content:
            "To add a vacation, sick leave, business trip or to move day off with a working day, click on this button",
        disableActions: true,
    },
    {
        selector: ".add-day-off-modal",
        content: "Here you can add day off or move work day for yourself",
        disableActions: false,
    },
    {
        selector: ".add-day-off-modal",
        content:
            "In the calendar you can see the days highlighted in different colors. You can see what each color means in the hint on the left",
    },
    {
        selector: ".day-off-tab",
        content:
            "To add day off: Step 1. Select the 'DAY OFF' tab. By default, this tab is already open, just go to the next step",
    },
    {
        selector: ".day-off-types",
        content:
            "Step 2. Choose day off type (NO NEED TO PRESS ANYTHING. JUST FOLLOW TO THE NEXT STEP)",
    },
    {
        selector: ".date-range-picker",
        content:
            "Step 3. Set a range of day off dates (NO NEED TO PRESS ANYTHING. JUST FOLLOW TO THE NEXT STEP)",
    },
    {
        selector: ".year-picker",
        content:
            "You can also switch years (NO NEED TO PRESS ANYTHING. JUST FOLLOW TO THE NEXT STEP)",
    },
    {
        selector: ".add-day-off-modal-save-button",
        content:
            "Step 4. The final step is to click on the save button (NO NEED TO PRESS ANYTHING. JUST FOLLOW TO THE NEXT STEP)",
    },
    {
        selector: ".add-day-off-modal",
        content:
            "After all the actions, a message will pop up about the successful addition of day off. If an error occurs when adding days off, a pop-up window will appear with the message",
    },
    {
        selector: ".move-work-day-tab",
        content: "To move work day: Step 1. Select the 'MOVE WORK DAY' tab",
        disableActions: true,
    },
    {
        selector: ".weekend-calendar",
        content:
            "Step 2. Choose the day you want to make a weekend (NO NEED TO PRESS ANYTHING. JUST FOLLOW TO THE NEXT STEP)",
        disableActions: false,
    },
    {
        selector: ".work-day-calendar",
        content:
            "Step 3. Choose the day you want to make a work day (NO NEED TO PRESS ANYTHING. JUST FOLLOW TO THE NEXT STEP)",
    },
    {
        selector: ".add-day-off-modal-save-button",
        content:
            "Step 4. The final step is to click on the save button (NO NEED TO PRESS ANYTHING. JUST FOLLOW TO THE NEXT STEP)",
    },
    {
        selector: ".add-day-off-modal",
        content:
            "After all the actions, a message will pop up about the successful work day move. If an error occurs when adding days off, a pop-up window will appear with the message",
    },
    {
        selector: ".day-off-list",
        content:
            "Here you can see a list of your vacations, sick days, business trips, vacation days correction, moved working days",
    },
    {
        selector: ".day-off-list",
        content:
            "You can edit or cancel certain days off depending on what is available to you (unavailable buttons are highlighted in gray). In these data grids you can filter and sort the data as you like",
    },
    // @ts-ignore
    {
        content: ({ setIsOpen, setCurrentStep }) => (
            <Box display="flex" flexDirection="column" gap={1}>
                <Typography textAlign="center">
                    Training on working with calendar has been successfully
                    completed. Congratulations 🙌🎉
                </Typography>

                <Button
                    onClick={() => {
                        setIsOpen(false);
                        setCurrentStep(0);
                        localStorage.setItem(
                            "calendarOnboardingCompletedEarlier",
                            "true",
                        );
                    }}
                    endIcon={<FlagIcon />}
                    color="success"
                    variant="outlined"
                    size="small"
                >
                    Finish
                </Button>
            </Box>
        ),
        position: "center",
    },
];

const CalendarOnboarding: FC<React.PropsWithChildren> = ({ children }) => {
    return (
        <Onboarding steps={steps} domainKey="calendar">
            {children}
        </Onboarding>
    );
};

export { CalendarOnboarding };
