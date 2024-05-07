import { Box, Chip, CircularProgress, Typography } from "@mui/material";
import { TrainingButton } from "_components/onboardings";
import { scheduleApi, useAppSelector } from "_redux";
import { FC } from "react";
import AddVacationCorrection from "./add_vacation_correction";
import { VacationBalanceHint } from "./vacation_balance_hint";

interface IFreeVacationDays {
    id: number;
    showTrainingButton?: boolean;
    hideAddCorrections?: boolean;
}

const FreeVacationDays: FC<IFreeVacationDays> = ({
    id,
    showTrainingButton,
    hideAddCorrections,
}) => {
    const profile = useAppSelector((state) => state.profile.payload);

    const { data: freeVacationDays } =
        scheduleApi.useGetEmployeeFreeVacationDaysQuery({ id });

    return (
        <Box
            className="free-vacation-days"
            display="flex"
            alignItems="center"
            gap={1}
        >
            <strong>Free vacation days (working days):</strong>

            {freeVacationDays?.payload ? (
                <>
                    <Chip
                        label={`${freeVacationDays?.payload?.free_vacation_days_year_end} till end of the year`}
                        color="info"
                    />
                    <Chip
                        label={
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography fontSize={13}>
                                    {
                                        freeVacationDays?.payload
                                            ?.free_vacation_days_current
                                    }{" "}
                                    for today
                                </Typography>

                                <VacationBalanceHint />
                            </Box>
                        }
                        color="warning"
                    />
                </>
            ) : (
                <CircularProgress color="success" size="20px" />
            )}

            {!hideAddCorrections &&
                (profile.hr || profile.roles?.includes("finance")) && (
                    <AddVacationCorrection employee_id={id} />
                )}

            {showTrainingButton && <TrainingButton />}
        </Box>
    );
};

export { FreeVacationDays };
