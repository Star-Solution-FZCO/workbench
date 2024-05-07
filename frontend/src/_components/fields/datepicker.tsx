import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { parseISO } from "date-fns";
import { get } from "lodash";
import React from "react";
import { Controller } from "react-hook-form";
import { Override } from "types/models";
import { ControllerT } from "./types";

type DatePickerFieldPropsT = {
    label?: string;
    name?: string;
    required?: boolean;
    error?: string;
    onChange: (value: string | null) => void;
    value: string | null;
    helperText?: string;
    disabled?: boolean;
};
export const DatePickerField = React.forwardRef<
    HTMLDivElement,
    DatePickerFieldPropsT
>(
    (
        { error, helperText, label, name, onChange, value, required, ...props },
        ref,
    ) => {
        return (
            <DatePicker
                ref={ref}
                label={label}
                // @ts-ignore
                value={typeof value === "string" ? parseISO(value) : value}
                slotProps={{
                    textField: {
                        name,
                        required,
                        error: !!error,
                        helperText: error || helperText,
                        fullWidth: true,
                    },
                    actionBar: {
                        actions: ["today", "clear"],
                    },
                }}
                format="dd/MM/yyyy"
                // @ts-ignore
                onChange={onChange}
                {...props}
            />
        );
    },
);
type FormDatePickerFieldPropsT = ControllerT<
    Omit<
        Override<DatePickerFieldPropsT, { name: string }>,
        "onChange" | "value" | "error"
    >
>;
export const FormDatePickerField: React.FC<FormDatePickerFieldPropsT> = ({
    control,
    name,
    rules,
    errors,
    required,
    ...props
}) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field }) => (
                <DatePickerField
                    {...props}
                    {...field}
                    required={(rules && "required" in rules) || required}
                    error={(get(errors, name)?.message as string) || ""}
                />
            )}
        />
    );
};
