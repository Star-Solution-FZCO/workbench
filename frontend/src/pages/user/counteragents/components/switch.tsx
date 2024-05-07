import { Box, Switch, Typography } from "@mui/material";
import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";
import EditableWrapper from "./editable_wrapper";

export interface ISwitchFieldProps {
    label: string;
    name: string;
    editable: boolean;
    editMode: boolean;
    value: boolean;
    onChangeEditMode: () => void;
}

const SwitchField: FC<ISwitchFieldProps> = (props) => {
    const { value, name } = props;

    const { control } = useFormContext();

    return (
        <EditableWrapper
            {...props}
            editModeChildren={
                <Controller
                    control={control}
                    name={name}
                    render={({ field: { value, onChange } }) => (
                        <Switch
                            checked={value}
                            onChange={(event) => onChange(event.target.checked)}
                        />
                    )}
                />
            }
            previewChildren={
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography>{value ? "Yes" : "No"}</Typography>
                </Box>
            }
        />
    );
};

export default SwitchField;
