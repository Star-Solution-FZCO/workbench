import HomeIcon from "@mui/icons-material/Home";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import WorkIcon from "@mui/icons-material/Work";
import {
    Box,
    FormControl,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import React from "react";
import { Control, Controller, FieldErrorsImpl } from "react-hook-form";
import ReactPhoneInput from "react-phone-input-material-ui";
import { PhoneModelT } from "types/models";
import { ClearButton } from "../buttons";

type PhoneFieldPropsT = {
    name: string;
    value: PhoneModelT;
    onChange: (value: PhoneModelT) => void;
    onBlur?: () => void;
    onDelete?: () => void;
    variant?: "standard" | "filled" | "outlined";
    errors?: FieldErrorsImpl;
};
export const PhoneField: React.FC<PhoneFieldPropsT> = ({
    name = "",
    variant = "standard",
    onChange,
    onBlur,
    onDelete,
    value,
    errors,
    value: { type, phone, description },
}) => {
    const handleChange = (name: string, val: string) =>
        onChange({ ...value, [name]: val });
    return (
        <Box display={"flex"} flexDirection={"row"} flexGrow={1}>
            <FormControl sx={{ width: "8rem" }}>
                <Box sx={{ mt: "15px", width: "100%" }}>
                    <Select
                        name={`${name}.type`}
                        value={type}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        onBlur={onBlur}
                        variant={variant}
                        sx={{ width: "100%" }}
                    >
                        <MenuItem value="work">
                            <Box display="flex" alignItems="center">
                                <WorkIcon
                                    fontSize="small"
                                    display="inline-block"
                                />
                                <Typography ml={1} display="inline-block">
                                    Work
                                </Typography>
                            </Box>
                        </MenuItem>
                        <MenuItem value="home">
                            <Box display="flex" alignItems="center">
                                <HomeIcon
                                    fontSize="small"
                                    display="inline-block"
                                />
                                <Typography ml={1} display="inline-block">
                                    Home
                                </Typography>
                            </Box>
                        </MenuItem>
                        <MenuItem value="mobile">
                            <Box display="flex" alignItems="center">
                                <PhoneIphoneIcon
                                    fontSize="small"
                                    display="inline-block"
                                />
                                <Typography ml={1} display="inline-block">
                                    Mobile
                                </Typography>
                            </Box>
                        </MenuItem>
                    </Select>
                </Box>
            </FormControl>
            <FormControl sx={{ width: "12rem" }}>
                <ReactPhoneInput
                    inputProps={{
                        name: `${name}.phone`,
                        variant,
                        required: true,
                        label: "Phone",
                        autoComplete: "none",
                        error: !!(errors && errors["phone"]),
                        helperText:
                            errors && errors["phone"]
                                ? errors["phone"]
                                : undefined,
                    }}
                    onBlur={onBlur}
                    component={TextField}
                    value={phone}
                    onChange={(value) => handleChange("phone", value)}
                />
            </FormControl>
            <FormControl sx={{ ml: 2, display: "flex", flexGrow: 1 }}>
                <TextField
                    name={`${name}.description`}
                    label="Description"
                    variant={variant}
                    multiline
                    value={description}
                    onBlur={onBlur}
                    inputProps={{ maxLength: 160 }}
                    onChange={(e) =>
                        handleChange("description", e.target.value)
                    }
                    helperText={`symbols left (160/${
                        160 - description.length
                    })`}
                />
            </FormControl>
            {onDelete && (
                <Box sx={{ mt: 2 }}>
                    <ClearButton tooltip="Remove phone" onClick={onDelete} />
                </Box>
            )}
        </Box>
    );
};
type ControlledPhoneFieldPropsT = {
    name: string;
    control: Control;
    variant?: "standard" | "filled" | "outlined";
    onDelete?: () => void;
    errors?: FieldErrorsImpl;
};
export const ControlledPhoneField: React.FC<ControlledPhoneFieldPropsT> = ({
    name,
    control,
    onDelete,
    variant = "standard",
}) => {
    return (
        <Box display={"flex"} flexDirection={"row"} flexGrow={1}>
            <FormControl sx={{ width: "8rem" }}>
                <Box sx={{ mt: "15px", width: "100%" }}>
                    <Controller
                        control={control}
                        name={`${name}.type`}
                        defaultValue={"mobile"}
                        render={({ field }) => (
                            <Select
                                {...field}
                                variant={variant}
                                sx={{ width: "100%" }}
                            >
                                <MenuItem value="work">
                                    <Box display="flex" alignItems="center">
                                        <WorkIcon
                                            fontSize="small"
                                            display="inline-block"
                                        />
                                        <Typography
                                            ml={1}
                                            display="inline-block"
                                        >
                                            Work
                                        </Typography>
                                    </Box>
                                </MenuItem>
                                <MenuItem value="home">
                                    <Box display="flex" alignItems="center">
                                        <HomeIcon
                                            fontSize="small"
                                            display="inline-block"
                                        />
                                        <Typography
                                            ml={1}
                                            display="inline-block"
                                        >
                                            Home
                                        </Typography>
                                    </Box>
                                </MenuItem>
                                <MenuItem value="mobile">
                                    <Box display="flex" alignItems="center">
                                        <PhoneIphoneIcon
                                            fontSize="small"
                                            display="inline-block"
                                        />
                                        <Typography
                                            ml={1}
                                            display="inline-block"
                                        >
                                            Mobile
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            </Select>
                        )}
                    />
                </Box>
            </FormControl>
            <FormControl sx={{ width: "12rem" }}>
                <Controller
                    control={control}
                    rules={{ required: true }}
                    name={`${name}.phone`}
                    defaultValue={""}
                    render={({ field: { name, ...field }, fieldState }) => (
                        <ReactPhoneInput
                            inputProps={{
                                name: name,
                                variant,
                                required: true,
                                label: "Phone",
                                autoComplete: "none",
                                error: !!fieldState.error,
                                helperText: fieldState.error?.message,
                            }}
                            component={TextField}
                            {...field}
                        />
                    )}
                />
            </FormControl>
            <FormControl sx={{ ml: 2, display: "flex", flexGrow: 1 }}>
                <Controller
                    control={control}
                    name={`${name}.description`}
                    rules={{
                        maxLength: {
                            value: 160,
                            message: "description max length is 160 chars",
                        },
                    }}
                    defaultValue={""}
                    render={({
                        field: { name, value, ...field },
                        fieldState,
                    }) => (
                        <TextField
                            {...field}
                            label="Description"
                            variant={variant}
                            value={value}
                            multiline
                            inputProps={{ maxLength: 160 }}
                            error={!!fieldState.error?.message}
                            helperText={
                                fieldState.error?.message ||
                                `symbols left (160/${160 - value.length})`
                            }
                        />
                    )}
                />
            </FormControl>
            {onDelete && (
                <Box sx={{ mt: 2 }}>
                    <ClearButton tooltip="Remove phone" onClick={onDelete} />
                </Box>
            )}
        </Box>
    );
};
