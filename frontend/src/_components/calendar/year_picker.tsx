import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Box, Button } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers-pro";
import { FC } from "react";

interface IYearPickerProps {
    year: Date | null;
    onChange: (value: Date | null) => void;
}

const YearPicker: FC<IYearPickerProps> = ({ year, onChange }) => {
    const resetToCurrentYear = () => {
        onChange(new Date());
    };

    const setPreviousYear = () => {
        if (!year) return;
        const newDate = new Date();
        newDate.setFullYear(year.getFullYear() - 1);
        onChange(newDate);
    };

    const setNextYear = () => {
        if (!year) return;
        const newDate = new Date();
        newDate.setFullYear(year.getFullYear() + 1);
        onChange(newDate);
    };

    return (
        <Box display="flex" gap="8px">
            <Button
                sx={{ width: "120px", height: "56px" }}
                onClick={setPreviousYear}
                startIcon={<ArrowBackIosNewIcon />}
                variant="outlined"
            >
                Previous
            </Button>

            <DatePicker
                value={year}
                label="Year"
                views={["year"]}
                openTo="year"
                onChange={onChange}
                sx={{ width: 120 }}
                slotProps={{
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    textField: { readOnly: true },
                }}
            />

            <Button
                sx={{ width: "120px", height: "56px" }}
                onClick={setNextYear}
                endIcon={<ArrowForwardIosIcon />}
                variant="outlined"
            >
                Next
            </Button>

            <Button
                sx={{ height: "56px" }}
                onClick={resetToCurrentYear}
                variant="outlined"
                color="info"
            >
                <RestartAltIcon />
            </Button>
        </Box>
    );
};

export default YearPicker;
