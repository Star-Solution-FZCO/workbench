import SearchIcon from "@mui/icons-material/Search";
import {
    Box,
    FormControl,
    FormHelperText,
    InputLabel,
    Typography,
} from "@mui/material";
import { UseQuery } from "@reduxjs/toolkit/dist/query/react/buildHooks";
import { QueryDefinition } from "@reduxjs/toolkit/query";
import { filter, join, map } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import Select, {
    ActionMeta,
    GroupBase,
    OptionProps,
    Props,
    SingleValueProps,
    components,
} from "react-select";
import AsyncSelect, { AsyncProps } from "react-select/async";
import { useReactSelectStyles } from "theme";
import { EmployeeSelectOptionT, Override, SelectOptionT } from "types/index";
import { ManagerView } from "../views/manager";
import { selectStyles } from "./_select_styles";
import { ControllerT } from "./types";

type BaseSelectPropsT = {
    label?: string;
    required?: boolean;
    helperText?: string;
    error?: string;
};

type AsyncSelectFieldPropsT = AsyncProps<
    SelectOptionT,
    boolean,
    GroupBase<SelectOptionT>
> &
    BaseSelectPropsT;

const getClassNames = (classes: object) =>
    join(
        filter(
            map(classes, (value, cls) => (value ? cls : "")),
            (value) => !!value,
        ),
        " ",
    );

export const SelectPlaceholder = () => {
    return (
        <Box display="flex" alignItems="center" gap={1}>
            <SearchIcon />
            <Typography>Type to search</Typography>
        </Box>
    );
};

export const BaseSelect: React.FC<
    BaseSelectPropsT & {
        focused: boolean;
        shrink: boolean;
        children: React.ReactNode;
    }
> = ({ label, required, focused, shrink, children, helperText, error }) => {
    return (
        <Box>
            {label && (
                <InputLabel
                    required={required}
                    focused={focused}
                    shrink={shrink}
                    error={!!error}
                >
                    {label}
                </InputLabel>
            )}
            {children}
            {(helperText || error) && (
                <FormHelperText error={!!error} sx={{ ml: 0 }}>
                    {error ? error : helperText}
                </FormHelperText>
            )}
        </Box>
    );
};
export const AsyncSelectField: React.FC<AsyncSelectFieldPropsT> = ({
    label,
    required = false,
    placeholder,
    error,
    helperText,
    ...props
}) => {
    const [focused, setFocused] = useState<boolean>(false);
    const classes = useReactSelectStyles();
    return (
        <BaseSelect
            focused={focused || !!props.value}
            shrink={focused || !!props.value}
            label={label}
            required={required}
        >
            <AsyncSelect
                cacheOptions
                defaultOptions
                placeholder={focused ? placeholder || "" : ""}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                aria-errormessage={error}
                {...props}
                className={classes.reactSelect}
                classNamePrefix={classes.reactSelect}
                styles={selectStyles}
            />
        </BaseSelect>
    );
};
type SelectFieldPropsT<T> = Props<T, boolean, GroupBase<T>> & BaseSelectPropsT;
export const SelectField = React.forwardRef<any, SelectFieldPropsT<any>>(
    (
        { label, name, required, placeholder, error, helperText, ...props },
        ref,
    ) => {
        const [searchParams] = useSearchParams();
        const [value, setValue] = useState(props.value);

        const [focused, setFocused] = useState<boolean>(false);
        const classes = useReactSelectStyles();

        const handleChange = (value: any, actionMeta: ActionMeta<any>) => {
            props?.onChange && props.onChange(value, actionMeta);
            setValue(value);
        };

        useEffect(() => {
            const matchedValueFromQueryParams = props.options?.find(
                (option) =>
                    option.value?.toString() === searchParams.get(name || ""),
            );

            matchedValueFromQueryParams &&
                setValue(matchedValueFromQueryParams);
        }, [name, searchParams, props.options]);

        return (
            <BaseSelect
                label={label}
                required={required}
                focused={focused || !!props.value}
                shrink={focused || !!props.value}
                helperText={helperText}
                error={error}
            >
                <Select
                    {...props}
                    value={value}
                    onChange={handleChange}
                    ref={ref}
                    styles={selectStyles}
                    className={getClassNames({
                        [classes.reactSelect]: true,
                        error,
                    })}
                    classNamePrefix={classes.reactSelect}
                    placeholder={placeholder || ""}
                    onFocus={() => setFocused(true)}
                    onBlur={(event) => {
                        setFocused(false);
                        props.onBlur && props.onBlur(event);
                    }}
                />
            </BaseSelect>
        );
    },
);
type ReduxSelectFieldPropsT<T> = SelectFieldPropsT<T> & {
    optionsLoadFn: UseQuery<QueryDefinition<any, any, any, any, any>>;
    emptyOption?: boolean;
};
export const ReduxSelect = React.forwardRef<any, ReduxSelectFieldPropsT<any>>(
    (props, ref) => {
        const [selectSearch, setSelectSearch] = useState("");
        const { data, isUninitialized, isLoading } =
            props.optionsLoadFn(selectSearch);

        return (
            <SelectField
                {...props}
                ref={ref}
                onInputChange={setSelectSearch}
                isSearchable
                isLoading={isUninitialized || isLoading}
                options={
                    props.emptyOption
                        ? data
                            ? [{ value: null, label: "<NONE>" }, ...data]
                            : [{ value: null, label: "<NONE>" }]
                        : data
                }
            />
        );
    },
);
type FormReduxSelectFieldPropsT<T> = Override<
    ControllerT<Override<ReduxSelectFieldPropsT<T>, { name: string }>>,
    { control?: any }
>;
export const FormReduxSelectField: React.FC<
    FormReduxSelectFieldPropsT<any>
> = ({ control, rules, name, required, ...props }) => {
    return (
        <FormControl variant="standard" fullWidth>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <ReduxSelect
                        {...field}
                        {...props}
                        required={(rules && "required" in rules) || required}
                    />
                )}
            />
        </FormControl>
    );
};
export const FormSelectEmployeeField: React.FC<
    FormReduxSelectFieldPropsT<any>
> = ({ control, rules, name, required, ...props }) => {
    const SingleValue = useCallback(
        (props: SingleValueProps<EmployeeSelectOptionT>) => (
            <components.SingleValue {...props}>
                {/* @ts-ignore */}
                <ManagerView
                    label={props.data.label}
                    id={props.data.value as number}
                />
            </components.SingleValue>
        ),
        [],
    );
    const Option = useCallback(
        (props: OptionProps<EmployeeSelectOptionT>) => (
            <components.Option {...props}>
                {/* @ts-ignore */}
                <ManagerView
                    label={props.data.label}
                    id={props.data.value as number}
                />
            </components.Option>
        ),
        [],
    );
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <ReduxSelect
                    {...field}
                    {...props}
                    required={(rules && "required" in rules) || required}
                    // @ts-ignore
                    components={{ SingleValue, Option }}
                />
            )}
        />
    );
};
