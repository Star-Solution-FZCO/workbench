import { Typography } from "@mui/material";
import { FormDatePickerField } from "_components/fields/datepicker";
import { format, parseISO } from "date-fns";
import { FC } from "react";
import { useFormContext } from "react-hook-form";
import { UpdateEmployeeT } from "types";
import EditableWrapper from "./editable_wrapper";

interface IDatePickerFieldProps {
    label: string;
    value: string | null | undefined;
    name: string;
    editMode: boolean;
    metadata: any;
    onChangeEditMode: () => void;
}

const DatePickerField: FC<IDatePickerFieldProps> = (props) => {
    const { label, value, name } = props;

    const { control } = useFormContext<UpdateEmployeeT>();

    return (
        <EditableWrapper
            {...props}
            editModeChildren={
                <FormDatePickerField
                    label={label}
                    name={name}
                    control={control}
                />
            }
            previewChildren={
                <Typography>
                    {value ? format(parseISO(value), "dd MMM Y") : "---"}
                </Typography>
            }
        />
    );
};

export default DatePickerField;
