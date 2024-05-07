import BusinessIcon from "@mui/icons-material/Business";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HomeIcon from "@mui/icons-material/Home";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    FormControl,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { map } from "lodash";
import React, { useCallback, useMemo } from "react";
import { Control, Controller, useFormContext, useWatch } from "react-hook-form";
import { theme } from "theme";
import { EmployeeFormLocation } from "types/models";
import { countries } from "utils/references";
import { ClearButton } from "../buttons";
import {
    ControllerListField,
    ControllerPhoneList,
    FormPhoneListField,
    renderControlInputT,
} from "./list";
import { AsyncSelectField } from "./select";
import { ControllerT } from "./types";

type LocationFieldPropsT = {
    control: Control;
    name: string;
    onDelete?: () => void;
};
const Header: React.FC<{ name: string }> = ({ name }) => {
    const { getValues } = useFormContext();

    const names = [`${name}.address`, `${name}.country`, `${name}.city`];
    useWatch({ name: names });
    const [address, country, city] = getValues(names);
    return (
        <Typography>
            {address ? `${country} ${city} ${address}` : "New location"}
        </Typography>
    );
};
export const LocationField: React.FC<LocationFieldPropsT> = ({
    name,
    control,
    onDelete,
}) => {
    const { register } = useFormContext();
    return (
        <Accordion defaultExpanded sx={{ width: "100%" }}>
            <AccordionSummary
                expandIcon={
                    <Tooltip title={"Expand/collapse location"}>
                        <ExpandMoreIcon />
                    </Tooltip>
                }
            >
                <Box display="flex" justifyContent="space-between" flexGrow={1}>
                    <Box>
                        <Header name={name} />
                    </Box>
                    {onDelete && (
                        <Box>
                            <ClearButton
                                buttonProps={{
                                    sx: [
                                        { p: 0 },
                                        {
                                            "&:hover": {
                                                color: theme.palette.error
                                                    .light,
                                            },
                                        },
                                    ],
                                }}
                                iconProps={{ fontSize: "small" }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                            />
                        </Box>
                    )}
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Box display="flex" flexDirection="column">
                    <Box flexGrow={1} my={1}>
                        <FormControl fullWidth>
                            <AsyncSelectField
                                label="Location"
                                placeholder="Select existing location"
                            />
                        </FormControl>
                    </Box>
                    <Box my={1} display={"flex"} flexDirection={"row"}>
                        <FormControl sx={{ pt: 2, mr: 1, width: "7rem" }}>
                            <Select
                                label="Type"
                                variant="standard"
                                defaultValue="home"
                                {...register(`${name}.type`)}
                            >
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
                                <MenuItem value="office">
                                    <Box display="flex" alignItems="center">
                                        <BusinessIcon
                                            fontSize="small"
                                            display="inline-block"
                                        />
                                        <Typography
                                            ml={1}
                                            display="inline-block"
                                        >
                                            Office
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl sx={{ mx: 1, width: "6rem" }}>
                            <TextField
                                label="ZIP"
                                variant="standard"
                                autoComplete="none"
                                {...register(`${name}.zip`)}
                            />
                        </FormControl>
                        <FormControl sx={{ mx: 1 }}>
                            <TextField
                                label="City"
                                required
                                autoComplete="none"
                                variant="standard"
                                {...register(`${name}.city`)}
                            />
                        </FormControl>
                        <Box display={"flex"} flexGrow={1}>
                            <FormControl sx={{ ml: 1 }} fullWidth>
                                <Box sx={{ pt: 2 }}>
                                    <Select
                                        required
                                        label="Country"
                                        variant="standard"
                                        defaultValue="RU"
                                        {...register(`${name}.country`, {
                                            required: true,
                                        })}
                                        sx={{ width: "100%" }}
                                    >
                                        {map(countries, (v, code) => (
                                            <MenuItem key={code} value={code}>
                                                <Typography>
                                                    {v.label}
                                                </Typography>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                            </FormControl>
                        </Box>
                    </Box>
                    <Box my={1}>
                        <FormControl fullWidth>
                            <TextField
                                required
                                label="Address"
                                autoComplete="none"
                                variant="standard"
                                {...register(`${name}.address`)}
                            />
                        </FormControl>
                    </Box>
                    <Box my={1}>
                        <FormControl fullWidth>
                            <ControllerPhoneList
                                name={`${name}.phones`}
                                label="Phone"
                                buttonText="Add new phone"
                                control={control as any}
                                onChange={() => {}}
                                value={[]}
                            />
                        </FormControl>
                    </Box>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
};
type ControllerLocationFieldPropsT = {
    name: string;
    onDelete?: () => void;
    control: any;
};
export const FormLocationField: React.FC<ControllerLocationFieldPropsT> = ({
    name,
    control,
    onDelete,
}) => {
    const onClickDelete = useCallback(
        (event: React.MouseEvent<Element, MouseEvent>) => {
            event.stopPropagation();
            onDelete && onDelete();
        },
        [onDelete],
    );
    const countryOptions = useMemo(
        () =>
            map(countries, (v, code) => (
                <MenuItem key={code} value={code}>
                    <Typography>{v.label}</Typography>
                </MenuItem>
            )),
        [],
    );
    return (
        <Accordion defaultExpanded sx={{ width: "100%" }}>
            <AccordionSummary
                expandIcon={
                    <Tooltip title={"Expand/collapse location"}>
                        <ExpandMoreIcon />
                    </Tooltip>
                }
            >
                <Box display="flex" justifyContent="space-between" flexGrow={1}>
                    <Box>
                        <Header name={name} />
                    </Box>
                    {onDelete && (
                        <Box>
                            <ClearButton
                                buttonProps={{
                                    sx: [
                                        { p: 0 },
                                        {
                                            "&:hover": {
                                                color: theme.palette.error
                                                    .light,
                                            },
                                        },
                                    ],
                                }}
                                iconProps={{ fontSize: "small" }}
                                onClick={onClickDelete}
                            />
                        </Box>
                    )}
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Box display="flex" flexDirection="column">
                    <Box flexGrow={1} my={1}>
                        <FormControl fullWidth>
                            <AsyncSelectField
                                label="Location"
                                placeholder="Select existing location"
                            />
                        </FormControl>
                    </Box>
                    <Box my={1} display={"flex"} flexDirection={"row"}>
                        <FormControl sx={{ pt: 2, mr: 1, width: "7rem" }}>
                            <Controller
                                control={control}
                                name={`${name}.type`}
                                render={({ field }) => (
                                    <Select
                                        label="Type"
                                        variant="standard"
                                        defaultValue="home"
                                        {...field}
                                    >
                                        <MenuItem value="home">
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                            >
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
                                        <MenuItem value="office">
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                            >
                                                <BusinessIcon
                                                    fontSize="small"
                                                    display="inline-block"
                                                />
                                                <Typography
                                                    ml={1}
                                                    display="inline-block"
                                                >
                                                    Office
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                )}
                            />
                        </FormControl>
                        <FormControl sx={{ mx: 1, width: "6rem" }}>
                            <Controller
                                control={control}
                                name={`${name}.zip`}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        label="ZIP"
                                        variant="standard"
                                        autoComplete="none"
                                        {...field}
                                        error={!!fieldState.error?.message}
                                        helperText={fieldState.error?.message}
                                    />
                                )}
                            />
                        </FormControl>
                        <FormControl sx={{ mx: 1 }}>
                            <Controller
                                control={control}
                                name={`${name}.city`}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        label="City"
                                        required
                                        autoComplete="none"
                                        variant="standard"
                                        {...field}
                                        error={!!fieldState.error?.message}
                                        helperText={fieldState.error?.message}
                                    />
                                )}
                            />
                        </FormControl>
                        <Box display={"flex"} flexGrow={1}>
                            <FormControl sx={{ ml: 1 }} fullWidth>
                                <Box sx={{ pt: 2 }}>
                                    <Controller
                                        name={`${name}.country`}
                                        rules={{ required: true }}
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <Select
                                                required
                                                label="Country"
                                                variant="standard"
                                                defaultValue="RU"
                                                error={
                                                    !!fieldState.error?.message
                                                }
                                                sx={{ width: "100%" }}
                                                {...field}
                                            >
                                                {countryOptions}
                                            </Select>
                                        )}
                                    />
                                </Box>
                            </FormControl>
                        </Box>
                    </Box>
                    <Box my={1}>
                        <FormControl fullWidth>
                            <Controller
                                name={`${name}.address`}
                                rules={{ required: true }}
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        required
                                        label="Address"
                                        autoComplete="none"
                                        variant="standard"
                                        {...field}
                                        error={!!fieldState.error?.message}
                                        helperText={fieldState.error?.message}
                                    />
                                )}
                            />
                        </FormControl>
                    </Box>
                    <Box my={1}>
                        <FormControl fullWidth>
                            <FormPhoneListField
                                control={control}
                                name={`${name}.phones`}
                            />
                        </FormControl>
                    </Box>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
};
const initialLocationItem: EmployeeFormLocation = {
    description: "",
    phones: [],
    type: "home",
    zip: "",
    city: "",
    country: "RU",
    address: "",
};
type FormListLocationFieldPropsT = ControllerT<{ label: string }>;
export const FormListLocationField: React.FC<FormListLocationFieldPropsT> = ({
    control,
    name,
    label,
}) => {
    const renderInput = useCallback<renderControlInputT>(
        (control, name, onDelete) => (
            <FormLocationField
                name={name}
                control={control}
                onDelete={onDelete}
            />
        ),
        [],
    );
    return (
        <ControllerListField
            name={name}
            label={label}
            control={control}
            renderInput={renderInput}
            buttonText="Add new location"
            newInitialItem={initialLocationItem}
        />
    );
};
