import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import {
    Box,
    Button,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemProps,
    ListProps,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { get, has, map } from "lodash";
import React, { PropsWithChildren, useCallback, useMemo } from "react";
import {
    Control,
    Controller,
    FieldErrorsImpl,
    RegisterOptions,
    useFieldArray,
} from "react-hook-form";
import { theme } from "theme";
import { Override, PhoneModelT } from "types/models";
import { ControlledPhoneField } from "./phone";

export type renderInputT<T> = (
    value: T,
    name: string,
    onChange: (value: T) => void,
    onBlur?: () => void,
    onDelete?: () => void,
    errors?: FieldErrorsImpl,
) => React.ReactNode;

type TypedListFieldPropsT<T> = BaseListFieldPropsT<T> & {
    onChange: (value: T[]) => void;
};

const initialPhoneItem: PhoneModelT = {
    type: "mobile",
    phone: "",
    description: "",
};
type BaseListPropsT = {
    label?: string;
    listProps?: ListProps;
    buttonText?: string;
    onAdd?: () => void;
    errors?: FieldErrorsImpl;
};
const BaseList: React.FC<PropsWithChildren<BaseListPropsT>> = ({
    label,
    buttonText = "Add new item",
    listProps,
    children,
    onAdd,
}) => {
    return (
        <Box sx={{ marginTop: 2 }}>
            {label && (
                <Typography
                    sx={{
                        color: theme.palette.text.secondary,
                        fontWidth: 400,
                        fontSize: "1rem",
                    }}
                >
                    {label}
                </Typography>
            )}
            <List sx={{ width: "100%" }} {...listProps}>
                {children}
                <ListItem sx={{ px: 0, flexGrow: 1 }}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            flexGrow: 1,
                        }}
                    >
                        <Button onClick={onAdd} startIcon={<AddIcon />}>
                            {buttonText}
                        </Button>
                    </Box>
                </ListItem>
            </List>
        </Box>
    );
};
type BaseListFieldPropsT<T> = BaseListPropsT & {
    name?: string;
    value: T[];
    listItemProps?: ListItemProps;
};
type ListFieldPropsT<T> = BaseListFieldPropsT<T> & {
    onChange: (index: number) => (value: T) => void;
    onDelete?: (index: number) => () => void;
    onBlur?: () => void;
    renderInput: renderInputT<T>;
};
export const ListField: React.FC<ListFieldPropsT<any>> = ({
    name,
    listProps,
    listItemProps,
    label,
    buttonText = "Add new item",
    renderInput,
    errors,
    onBlur,
    onDelete,
    onChange,
    onAdd,
    value,
}) => {
    return (
        <BaseList
            buttonText={buttonText}
            label={label}
            onAdd={onAdd}
            listProps={listProps}
            errors={errors}
        >
            {map(value, (v, idx) => (
                <ListItem
                    key={`${name}-${idx}`}
                    sx={{ p: 0 }}
                    {...listItemProps}
                >
                    {renderInput(
                        v,
                        `${name}.${idx}`,
                        onChange(idx),
                        onBlur,
                        onDelete && onDelete(idx),
                        errors,
                    )}
                </ListItem>
            ))}
        </BaseList>
    );
};
export type renderControlInputT = (
    control: Control,
    name: string,
    onDelete?: () => void,
    errors?: FieldErrorsImpl,
) => React.ReactNode;
type ControllerListFieldPropsT<T> = BaseListPropsT & {
    name: string;
    control: any;
    renderInput: renderControlInputT;
    newInitialItem: T;
    listProps?: ListProps;
    listItemProps?: ListItemProps;
};
export const ControllerListField: React.FC<ControllerListFieldPropsT<any>> = <
    T,
>({
    name,
    label,
    buttonText = "Add new item",
    control,
    renderInput,
    newInitialItem,
    listProps,
    errors,
    listItemProps,
}: ControllerListFieldPropsT<T>) => {
    const { fields, append, remove } = useFieldArray({ name, control });
    const handleAdd = useCallback(
        () => append(newInitialItem),
        [append, newInitialItem],
    );
    const handleDelete = useCallback(
        (index: number) => () => remove(index),
        [remove],
    );
    return (
        <BaseList
            errors={errors}
            onAdd={handleAdd}
            label={label}
            buttonText={buttonText}
            listProps={listProps}
        >
            {map(fields, (item, index) => (
                <ListItem key={item.id} sx={{ p: 0 }} {...listItemProps}>
                    {renderInput(
                        control,
                        `${name}.${index}`,
                        handleDelete(index),
                        errors,
                    )}
                </ListItem>
            ))}
        </BaseList>
    );
};
type ControllerPhoneListPropsT = Override<
    TypedListFieldPropsT<PhoneModelT>,
    { name: string }
> & {
    control: Control<PhoneModelT[]>;
};
export const ControllerPhoneList: React.FC<ControllerPhoneListPropsT> = (
    props,
) => {
    const renderInput = useMemo<renderControlInputT>(
        () => (control, name, onDelete) => (
            <ControlledPhoneField
                control={control}
                name={name}
                onDelete={onDelete}
            />
        ),
        [],
    );
    return (
        <ControllerListField
            {...props}
            control={props.control as any}
            newInitialItem={{ phone: "", description: "", type: "mobile" }}
            renderInput={renderInput as renderControlInputT}
        />
    );
};

type BaseFormListFieldPropsT = BaseListPropsT & {
    control: any;
    name: string;
};
type FormListFieldPropsT<T> = BaseFormListFieldPropsT & {
    newInitialItem: T;
    renderInput: renderInputT<T>;
    rules?: RegisterOptions;
    onBlur?: () => void;
};
export const FormPhoneListField: React.FC<BaseFormListFieldPropsT> = ({
    buttonText = "Add phone",
    ...props
}) => {
    const renderInput = useCallback<renderControlInputT>(
        (control, name, onDelete, errors) => (
            <ControlledPhoneField
                {...{ control, onDelete, errors }}
                name={name}
            />
        ),
        [],
    );
    return (
        <ControllerListField
            {...props}
            buttonText={buttonText}
            newInitialItem={initialPhoneItem}
            renderInput={renderInput}
        />
    );
};
export const FormStringListField: React.FC<
    Omit<FormListFieldPropsT<string>, "newInitialItem" | "renderInput">
> = ({ rules, ...props }) => {
    const renderInput = useCallback<renderControlInputT>(
        (control, name, onDelete, errors) => (
            <Controller
                name={`${name}.value`}
                control={control}
                rules={rules}
                render={({ field }) => (
                    <TextField
                        {...field}
                        fullWidth
                        variant="standard"
                        autoComplete="none"
                        required
                        error={has(errors, `${name}.value`)}
                        helperText={
                            get(errors, `${name}.value`)?.message as string
                        }
                        InputProps={
                            onDelete
                                ? {
                                      endAdornment: (
                                          <InputAdornment position="end">
                                              <Tooltip title="Delete">
                                                  <IconButton
                                                      disableRipple
                                                      sx={{
                                                          px: 0,
                                                          "&:hover": {
                                                              color: theme
                                                                  .palette.error
                                                                  .light,
                                                          },
                                                      }}
                                                      onClick={onDelete}
                                                  >
                                                      <ClearIcon />
                                                  </IconButton>
                                              </Tooltip>
                                          </InputAdornment>
                                      ),
                                  }
                                : {}
                        }
                    />
                )}
            />
        ),
        [rules],
    );
    return (
        <ControllerListField
            newInitialItem={{ value: "" }}
            renderInput={renderInput}
            {...props}
        />
    );
};
