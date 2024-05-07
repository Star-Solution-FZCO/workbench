import { FormControlLabel, Switch } from "@mui/material";
import React from "react";
import { Controller } from "react-hook-form";
import { ControllerT } from "./types";

type FormSwitchFieldPropsT = ControllerT<{ label: string }>;
export const FormSwitchField: React.FC<FormSwitchFieldPropsT> = ({
    control,
    name,
    label,
}) => (
    <FormControlLabel
        control={
            <Controller
                control={control}
                name={name}
                render={({ field: { value, onChange } }) => (
                    <Switch
                        checked={value}
                        onChange={(event) => onChange(event.target.checked)}
                        inputProps={{ "aria-label": "controlled" }}
                    />
                )}
            />
        }
        label={label}
    />
);
