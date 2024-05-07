import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
} from "@mui/material";
import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";
import EditableWrapper from "./editable_wrapper";

type SelectOptionT = {
    value: string;
    label: string;
};

export interface ISelectFieldProps {
    value: string;
    name: string;
    label: string;
    options: SelectOptionT[];
    editable: boolean;
    editMode: boolean;
    onChangeEditMode: () => void;
}

const SelectField: FC<ISelectFieldProps> = (props) => {
    const { value, name, label, options } = props;

    const { control } = useFormContext();

    return (
        <EditableWrapper
            {...props}
            editModeChildren={
                <Controller
                    name={name}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <FormControl fullWidth>
                            <InputLabel id={label}>{label}</InputLabel>
                            <Select
                                labelId={label}
                                label={label}
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                size="small"
                            >
                                {options.map((option) => (
                                    <MenuItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                />
            }
            previewChildren={
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography>
                        {
                            options.find((option) => option.value === value)
                                ?.label
                        }
                    </Typography>
                </Box>
            }
        />
    );
};

export default SelectField;
