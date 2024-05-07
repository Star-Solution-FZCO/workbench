import { Box, InputLabel, List, ListItem, Typography } from "@mui/material";
import { UseQuery } from "@reduxjs/toolkit/dist/query/react/buildHooks";
import { QueryDefinition } from "@reduxjs/toolkit/query";
import { filter, includes, map } from "lodash";
import React, { ComponentType, useCallback, useMemo, useState } from "react";
import { Controller, ControllerProps } from "react-hook-form";
import Select, { OptionProps, components } from "react-select";
import CreatableSelect from "react-select/creatable";
import { theme, useReactSelectStyles } from "theme";
import { EmployeeSelectOptionT, SelectOptionT } from "types";
import { ClearButton } from "../buttons";
import { EmployeeAvatarInteractive } from "../views/manager";
import { selectStyles } from "./_select_styles";

type ValueTypeT = SelectOptionT[];
export type BaseSelectFieldPropsT = {
    label?: string;
    noOptionsMessage?: string;
    placeholder?: string;
    removeButtonTooltip?: string;
    value: SelectOptionT[];
    clearable?: boolean;
    Option?: ComponentType<OptionProps>;
    required?: boolean;
    helperText?: string;
    error?: string;
};
type BaseListSelectFieldPropsT = BaseSelectFieldPropsT & {
    options: SelectOptionT[];
    isLoading: boolean;
    onSearch?: (search: string) => void;
    onChange: (value: SelectOptionT[]) => void;
    onDelete?: (value: SelectOptionT) => void;
    onCreateOption?: (value: string) => void;
    onBlur?: () => void;
    filterFn?: (
        values: (string | number)[],
    ) => (candidate: SelectOptionT, input: string) => boolean;
};
type RenderPropsT = {
    value: ValueTypeT;
    handleDelete?: (value: SelectOptionT) => void;
    removeButtonTooltip?: string;
    SelectElement: React.ReactElement;
};
type RawListSelectFieldPropsT = BaseListSelectFieldPropsT & {
    renderBody: (props: RenderPropsT) => React.ReactNode;
};

export const DefaultOption: React.FC<OptionProps<any>> = (props) => (
    <components.Option {...props}>
        {/* @ts-ignore */}
        <Typography>{props.label}</Typography>
    </components.Option>
);

const filterOptions =
    (values: (number | string)[]) => (candidate: SelectOptionT) =>
        !includes(values, candidate.value);

const RawListSelectField = React.forwardRef<Select, RawListSelectFieldPropsT>(
    (
        {
            clearable = false,
            label,
            noOptionsMessage,
            placeholder,
            removeButtonTooltip,
            Option,
            options,
            onDelete,
            isLoading,
            onSearch,
            onBlur,
            filterFn = filterOptions,
            value,
            onCreateOption,
            onChange,
            renderBody,
            ...props
        },
        ref,
    ) => {
        const [focused, setFocused] = useState(false);
        const classes = useReactSelectStyles();
        const values = useMemo<(number | string)[]>(
            () => map(value, (v) => v.value),
            [value],
        );
        const handleChange = useCallback(
            (selected: SelectOptionT) => onChange([selected, ...value]),
            [onChange, value],
        );
        const handleFocus = useCallback(() => setFocused(true), []);
        const handleFocusOut = useCallback(() => {
            setFocused(false);
            onBlur && onBlur();
        }, [onBlur]);
        const handleDelete = clearable
            ? (val: SelectOptionT) =>
                  onDelete
                      ? onDelete(val)
                      : onChange(filter(value, (v) => v.value !== val.value))
            : undefined;
        const SelectElement = useMemo(
            () =>
                onCreateOption ? (
                    <CreatableSelect
                        ref={ref as any}
                        noOptionsMessage={
                            noOptionsMessage
                                ? () => noOptionsMessage
                                : undefined
                        }
                        value={null}
                        className={classes.reactSelect}
                        classNamePrefix={classes.reactSelect}
                        styles={selectStyles}
                        // @ts-ignore
                        components={{ Option: Option ? Option : DefaultOption }}
                        filterOption={filterFn(values)}
                        isLoading={isLoading}
                        options={options}
                        onInputChange={onSearch}
                        placeholder={placeholder || ""}
                        onBlur={handleFocusOut}
                        onFocus={handleFocus}
                        onChange={handleChange as (select: any) => void}
                        onCreateOption={onCreateOption}
                    />
                ) : (
                    <Select
                        ref={ref as any}
                        noOptionsMessage={
                            noOptionsMessage
                                ? () => noOptionsMessage
                                : undefined
                        }
                        value={null}
                        className={classes.reactSelect}
                        classNamePrefix={classes.reactSelect}
                        styles={selectStyles}
                        // @ts-ignore
                        components={{ Option: Option ? Option : DefaultOption }}
                        filterOption={filterFn(values)}
                        isLoading={isLoading}
                        options={options}
                        onInputChange={onSearch}
                        placeholder={placeholder || ""}
                        onBlur={handleFocusOut}
                        onFocus={handleFocus}
                        onChange={handleChange as (select: any) => void}
                    />
                ),
            [
                Option,
                classes.reactSelect,
                filterFn,
                handleChange,
                handleFocus,
                handleFocusOut,
                isLoading,
                noOptionsMessage,
                onCreateOption,
                onSearch,
                options,
                placeholder,
                ref,
                values,
            ],
        );
        return (
            <Box mt={0.6}>
                {label && (
                    <InputLabel
                        variant="standard"
                        required={props.required}
                        focused={focused || (value && !!value.length)}
                        shrink={
                            focused ||
                            !!placeholder ||
                            (value && !!value.length)
                        }
                        error={!!props.error}
                    >
                        {label}
                    </InputLabel>
                )}
                {renderBody({
                    handleDelete,
                    value,
                    SelectElement,
                    removeButtonTooltip,
                })}
            </Box>
        );
    },
);
export type ListSelectFieldPropsT = BaseListSelectFieldPropsT & {
    ValueItem?: ComponentType<{
        value: SelectOptionT;
        onDelete?: (value: SelectOptionT) => void;
    }>;
};

export const ListSelectField = React.forwardRef<Select, ListSelectFieldPropsT>(
    ({ ValueItem, ...props }, ref) => {
        const renderList = useCallback(
            ({
                value,
                handleDelete,
                removeButtonTooltip,
                SelectElement,
            }: RenderPropsT) => (
                <List
                    sx={[
                        {
                            width: "100%",
                            p: 0,
                        },
                        {
                            "& li:first-of-type": {
                                marginTop: 1,
                            },
                        },
                    ]}
                >
                    {map(value, (val) =>
                        ValueItem ? (
                            <ValueItem
                                key={val.value}
                                value={val}
                                onDelete={handleDelete}
                            />
                        ) : (
                            <ListItem
                                key={val.value}
                                sx={{ px: 0, py: 0, minHeight: 30 }}
                                secondaryAction={
                                    handleDelete && (
                                        <ClearButton
                                            buttonProps={{ edge: "end" }}
                                            tooltip={removeButtonTooltip}
                                            iconProps={{ fontSize: "small" }}
                                            onClick={() => handleDelete(val)}
                                        />
                                    )
                                }
                            >
                                {val.label}
                            </ListItem>
                        ),
                    )}

                    <ListItem sx={{ p: 0, flexGrow: 1, mt: "0 !important" }}>
                        {SelectElement}
                    </ListItem>
                </List>
            ),
            [ValueItem],
        );

        return (
            <RawListSelectField {...props} ref={ref} renderBody={renderList} />
        );
    },
);

export type ReduxListSelectFieldPropsT = BaseSelectFieldPropsT & {
    onChange: (value: SelectOptionT[]) => void;
    optionsLoadFn: UseQuery<QueryDefinition<any, any, any, any, any>>;
};
export const ReduxListSelectField = React.forwardRef<
    Select,
    ReduxListSelectFieldPropsT
>(({ optionsLoadFn, ...props }, ref) => {
    const [search, setSearch] = useState("");
    const { data, isUninitialized, isLoading } = optionsLoadFn(search);
    return (
        <ListSelectField
            options={data || []}
            {...props}
            isLoading={isUninitialized || isLoading}
            onSearch={setSearch}
            ref={ref}
        />
    );
});
export type FormReduxListSelectFieldPropsT = Omit<
    ReduxListSelectFieldPropsT,
    "onChange" | "value"
> &
    Pick<ControllerProps, "control" | "rules" | "name"> &
    Pick<ListSelectFieldPropsT, "ValueItem" | "onCreateOption">;

export const FormReduxListSelectField: React.FC<
    FormReduxListSelectFieldPropsT
> = ({ name, control, rules, ...props }) => (
    <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => <ReduxListSelectField {...props} {...field} />}
    />
);
type EmployeeItemPropsT = {
    value: EmployeeSelectOptionT;
    onDelete?: (value: EmployeeSelectOptionT) => void;
};
const EmployeeItem: React.FC<EmployeeItemPropsT> = ({ onDelete, value }) => (
    <ListItem
        sx={{ px: 0, py: 0, minHeight: 30 }}
        secondaryAction={
            onDelete && (
                <ClearButton
                    buttonProps={{ edge: "end" }}
                    tooltip="Remove person"
                    iconProps={{ fontSize: "small" }}
                    onClick={() => onDelete(value)}
                />
            )
        }
    >
        <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
            <EmployeeAvatarInteractive
                employee={{
                    id: value.value as number,
                    english_name: value.label,
                    pararam: value.pararam || null,
                }}
            />
            <Typography>{value.label}</Typography>
        </Box>
    </ListItem>
);
const EmployeeOption: React.FC<OptionProps<any>> = (props) => (
    <components.Option {...props}>
        {/* @ts-ignore */}
        <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
            <EmployeeAvatarInteractive
                employee={{
                    id: props.data.value,
                    english_name: props.label,
                    pararam: props.data.pararam,
                }}
            />
            <Typography>
                {props.label} {props.data.pararam && `(@${props.data.pararam})`}
            </Typography>
        </Box>
    </components.Option>
);

export const EmployeeFormReduxListSelectField: React.FC<
    FormReduxListSelectFieldPropsT
> = ({ name, control, rules, ...props }) => (
    <FormReduxListSelectField
        name={name}
        control={control}
        rules={rules}
        Option={EmployeeOption}
        {...props}
        ValueItem={EmployeeItem as any}
    />
);

type MultipleTagFormSelectFieldPropsT = FormReduxListSelectFieldPropsT & {
    isCreatable?: boolean;
};
export const MultipleTagFormSelectField: React.FC<
    MultipleTagFormSelectFieldPropsT
> = ({ name, control, rules, isCreatable, optionsLoadFn, ...props }) => {
    const [search, setSearch] = useState("");
    const { data, isUninitialized, isLoading } = optionsLoadFn(search);

    const renderBody = ({
        handleDelete,
        value,
        SelectElement,
        removeButtonTooltip,
    }: RenderPropsT) => {
        return (
            <Box display="row" flexDirection="column">
                <Box
                    display="flex"
                    flexDirection="row"
                    sx={{ "& :not(:first-of-type)": { marginLeft: 0.5 } }}
                >
                    {map(value, (item) => (
                        <Box
                            key={item.value}
                            sx={{
                                backgroundColor: theme.palette.grey[400],
                                px: 1,
                                borderRadius: 0.5,
                            }}
                        >
                            <Typography>
                                {item.label}
                                {handleDelete && (
                                    <ClearButton
                                        buttonProps={{ sx: { ml: 0.5 } }}
                                        onClick={() => handleDelete(item)}
                                        tooltip={removeButtonTooltip}
                                    />
                                )}
                            </Typography>
                        </Box>
                    ))}
                </Box>
                <Box display="flex" flexDirection="row">
                    {SelectElement}
                </Box>
            </Box>
        );
    };

    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field }) => {
                const onCreate = (value: string) =>
                    field.onChange([...field.value, { label: value, value }]);
                return (
                    <RawListSelectField
                        clearable
                        onCreateOption={isCreatable ? onCreate : undefined}
                        renderBody={renderBody}
                        options={data || []}
                        {...props}
                        isLoading={isUninitialized || isLoading}
                        onSearch={setSearch}
                        {...field}
                    />
                );
            }}
        />
    );
};

export const CreatableMultipleTagFormSelectField: React.FC<
    Omit<MultipleTagFormSelectFieldPropsT, "isCreatable">
> = (props) => {
    return <MultipleTagFormSelectField {...props} isCreatable />;
};
