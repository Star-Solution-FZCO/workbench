import { TextField, TextFieldProps } from "@mui/material";
import { get, has } from "lodash";
import React, { useCallback } from "react";
import {
    FieldErrorsImpl,
    RegisterOptions,
    UseFormRegister,
    useWatch,
} from "react-hook-form";
import { Override } from "types/models";

type FormHookTextFieldPropsT = Override<
    Exclude<TextFieldProps, "error">,
    { errors?: FieldErrorsImpl; name: string }
> & {
    register: UseFormRegister<any>;
    rules?: RegisterOptions;
    disableAutocomplete?: boolean;
    changeHandler?: (
        event: React.ChangeEvent<HTMLInputElement>,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
    ) => void;
};

export const FormTextField: React.FC<FormHookTextFieldPropsT> = ({
    disableAutocomplete = true,
    errors,
    helperText,
    required,
    register,
    name,
    rules,
    changeHandler,
    ...props
}) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const value = changeHandler ? useWatch({ name }) : undefined;

    const { onChange, ...registerProps } = register(name, rules);

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) =>
            changeHandler ? changeHandler(event, onChange) : onChange(event),
        [changeHandler, onChange],
    );

    return (
        <TextField
            {...props}
            {...(disableAutocomplete ? { autoComplete: "none" } : {})}
            required={
                required || (rules && "required" in rules && rules.required)
                    ? true
                    : undefined
            }
            error={has(errors, name)}
            helperText={(get(errors, name)?.message as string) || helperText}
            {...registerProps}
            value={value}
            onChange={handleChange}
        />
    );
};
