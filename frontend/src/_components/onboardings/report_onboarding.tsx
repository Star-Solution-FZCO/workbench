import FlagIcon from "@mui/icons-material/Flag";
import { Box, Button, Typography } from "@mui/material";
import { StepType } from "@reactour/tour";
import { FC } from "react";
import { Onboarding } from "./onboarding";

const steps: StepType[] = [
    // @ts-ignore
    {
        content:
            "Welcome to Work Reports 👋 To learn how to work with reports, go to the next step",
        position: "center",
    },
    {
        selector: ".reports-datepickers",
        content:
            "To create a report, the first step is to select the date period from and to",
    },
    {
        selector: ".date-shortcuts",
        content:
            "You can also use date shortcuts to quickly set the date period",
    },
    {
        selector: ".report-type-select",
        content:
            "The next step is to select the type of report you need. Note: for the 'Vacations free days' report, you do not need to set the date period from and to",
    },
    {
        selector: ".activity-column-filter-button",
        content:
            "This button opens the settings menu for displaying certain columns in the activity report tables. Сlick on it to open the menu",
        disableActions: true,
    },
    {
        selector: ".activity-column-filter",
        content:
            "Here you can select the columns you need to display in the report tables. Go to the next step",
        disableActions: false,
    },
    {
        selector: ".reports-groups",
        content:
            "You can create and manage personal user groups for more convenient work with reports",
    },
    {
        selector: ".reports-search-field",
        content: "You can search for people by name or email",
    },
    {
        selector: ".reports-filters-button",
        content: "Click the button to show the filters available to you",
        disableActions: true,
    },
    {
        selector: ".people-list-filter",
        content: "Filter people by the criteria you need",
        disableActions: false,
    },
    {
        selector: ".MuiDataGrid-columnHeaderCheckbox",
        content:
            "Last step before generating the report. The most important thing before generating the report, do not forget to select the right people with checkboxes, otherwise a report will be generated for all people, which will take a long time and may lead to problems with site performance",
    },
    {
        selector: ".reports-generate-button",
        content:
            "After selecting the people you need to generate the report, click on this button. You can also generate a report by pressing the Enter key",
    },
    {
        selector: ".reports-export-button",
        content:
            "To export the report in CSV file format, click on this button. All applied filters (selected people) will be taken into account",
    },
    // @ts-ignore
    {
        content: ({ setIsOpen, setCurrentStep }) => (
            <Box display="flex" flexDirection="column" gap={1}>
                <Typography textAlign="center">
                    Training on working with reports has been successfully
                    completed. Congratulations 🙌🎉
                </Typography>

                <Button
                    onClick={() => {
                        setIsOpen(false);
                        setCurrentStep(0);
                        localStorage.setItem(
                            "reportOnboardingCompletedEarlier",
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

const ReportOnboarding: FC<React.PropsWithChildren> = ({ children }) => {
    return (
        <Onboarding steps={steps} domainKey="report">
            {children}
        </Onboarding>
    );
};

export { ReportOnboarding };
