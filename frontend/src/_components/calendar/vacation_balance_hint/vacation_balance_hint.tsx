import InfoIcon from "@mui/icons-material/Info";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { useTour } from "@reactour/tour";
import { Modal } from "_components";
import clsx from "clsx";
import { useEffect, useState } from "react";
import "./vacation_balance.hint.css";

const VacationBalanceHint = () => {
    const { isOpen, currentStep, setCurrentStep } = useTour();

    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setOpen(currentStep === 3);
            return;
        }
    }, [isOpen, currentStep]);

    return (
        <>
            <Tooltip
                sx={{ cursor: "pointer" }}
                title="It is your balance proportional to the current day of the year. Сlick to learn more"
                placement="top"
                arrow
            >
                <Box
                    className={clsx({
                        "vacation-balance-hint_highlighted": currentStep === 2,
                    })}
                    display="flex"
                    alignItems="center"
                >
                    <InfoIcon
                        className="vacation-balance-hint"
                        fontSize="small"
                        onClick={() => {
                            setOpen(true);
                            if (isOpen) {
                                setCurrentStep(3);
                            }
                        }}
                    />
                </Box>
            </Tooltip>

            <Modal
                className="vacation-balance-explanation"
                open={open}
                onClose={() => setOpen(false)}
            >
                <Box display="flex" flexDirection="column" gap={1}>
                    <Box>
                        <Typography fontWeight={700}>
                            Why do I have a negative balance of free vacation
                            days for today?
                        </Typography>
                        <Typography>For example:</Typography>
                        <Typography>
                            Today is 23 May 2023. For the whole year, you have
                            22 working days for vacation, it's 22/365 = 0.0602
                            days per day. So for today, 143 days have passed
                            from the start of the year and you have 0.0602*143 ~
                            9 days of vacation and 22 - 9 = 13 days of vacation
                            in advance.
                        </Typography>
                        <Typography>
                            If you already set vacation for 15 working days this
                            year (before today, in May, for example) your
                            balance would be
                        </Typography>
                        <Typography fontWeight={700}>
                            22 - 15 = 7 free days of vacation till the end of
                            the year
                        </Typography>
                        <Typography fontWeight={700}>
                            9 - 15 = -6 free days for today
                        </Typography>
                    </Box>
                    <Button
                        sx={{ alignSelf: "center" }}
                        onClick={() => setOpen(false)}
                        variant="outlined"
                        color="error"
                    >
                        Close
                    </Button>
                </Box>
            </Modal>
        </>
    );
};

export { VacationBalanceHint };
