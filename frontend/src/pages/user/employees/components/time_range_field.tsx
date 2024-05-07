import { Box, Typography } from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers";
import { format } from "date-fns";
import { FC, useState } from "react";
import { useFormContext } from "react-hook-form";
import { TimeRangeT, UpdateEmployeeT } from "types";
import { HHmmToDate } from "utils";
import EditableWrapper from "./editable_wrapper";

interface ITimeRangeFieldProps {
    label: string;
    value: TimeRangeT | null;
    name: string;
    editMode: boolean;
    metadata: any;
    onChangeEditMode: () => void;
}

const TimeRangeField: FC<ITimeRangeFieldProps> = (props) => {
    const { value } = props;

    const { setValue } = useFormContext<UpdateEmployeeT>();

    const [range, setRange] = useState({
        start: HHmmToDate(value?.start),
        end: HHmmToDate(value?.end),
    });

    const handleChange = (_value: Date | null, field: "start" | "end") => {
        if (_value && !isNaN(_value.getTime())) {
            setRange({ ...range, [field]: _value });
            setValue(`availability_time.${field}`, format(_value, "HH:mm"));
        }
    };

    return (
        <Box mt={0.5}>
            <EditableWrapper
                {...props}
                editModeChildren={
                    <Box display="flex" gap={1}>
                        <TimePicker
                            label="Start time"
                            value={range.start}
                            onChange={(v) => handleChange(v, "start")}
                            ampm={false}
                            slotProps={{
                                textField: {
                                    size: "small",
                                },
                            }}
                        />
                        <TimePicker
                            label="End time"
                            value={range.end}
                            onChange={(v) => handleChange(v, "end")}
                            ampm={false}
                            slotProps={{
                                textField: {
                                    size: "small",
                                },
                            }}
                        />
                    </Box>
                }
                previewChildren={
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography>From: {value?.start || "---"}</Typography>
                        <Typography>To: {value?.end || "---"}</Typography>
                    </Box>
                }
            />
        </Box>
    );
};

export default TimeRangeField;
