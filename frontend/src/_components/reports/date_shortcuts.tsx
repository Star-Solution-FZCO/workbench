import { Box, Button } from "@mui/material";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { FC } from "react";

const previousMonth = new Date();
previousMonth.setDate(0);
const previousWeek = new Date();
previousWeek.setDate(new Date().getDate() - 7);
const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);
const lastDayOfYear = new Date(new Date().getFullYear(), 11, 31);

interface IDateShortcutsProps {
    setRange: (start: Date, end: Date) => void;
}

const DateShortcuts: FC<IDateShortcutsProps> = ({ setRange }) => {
    return (
        <Box
            className="date-shortcuts"
            display="flex"
            alignItems="center"
            gap={1}
        >
            <Button
                onClick={() =>
                    setRange(
                        startOfMonth(previousMonth),
                        endOfMonth(previousMonth),
                    )
                }
                variant="outlined"
                size="small"
                color="info"
            >
                Previous month
            </Button>
            <Button
                onClick={() =>
                    setRange(
                        startOfWeek(previousWeek, { weekStartsOn: 1 }),
                        endOfWeek(previousWeek, { weekStartsOn: 1 }),
                    )
                }
                variant="outlined"
                size="small"
                color="info"
            >
                Previous week
            </Button>
            <Button
                onClick={() =>
                    setRange(
                        startOfWeek(new Date(), { weekStartsOn: 1 }),
                        endOfWeek(new Date(), { weekStartsOn: 1 }),
                    )
                }
                variant="outlined"
                size="small"
                color="info"
            >
                Current week
            </Button>
            <Button
                onClick={() =>
                    setRange(startOfMonth(new Date()), endOfMonth(new Date()))
                }
                variant="outlined"
                size="small"
                color="info"
            >
                Current month
            </Button>
            <Button
                onClick={() => setRange(firstDayOfYear, lastDayOfYear)}
                variant="outlined"
                size="small"
                color="info"
            >
                For a year
            </Button>
        </Box>
    );
};

export { DateShortcuts };
