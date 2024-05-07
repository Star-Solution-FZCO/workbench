import {
    Box,
    FormControl,
    FormHelperText,
    InputLabel,
    Link,
    MenuItem,
    Select,
    TextField,
    TextFieldProps,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers-pro";
import { nanoid } from "@reduxjs/toolkit";
import MDEditor from "@uiw/react-md-editor";
import { FC, useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Controller, useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import rehypeSanitize from "rehype-sanitize";
import { ServiceFieldT } from "types";
import { FileCard } from "./file_card";

const requiredFieldMessage = "Required field";

interface IDynamicFieldProps {
    field: ServiceFieldT;
}

interface IDynamicTextFieldProps extends IDynamicFieldProps {
    textfieldProps?: TextFieldProps;
}

const DynamicTextField: FC<IDynamicTextFieldProps> = ({
    field,
    textfieldProps,
}) => {
    const {
        register,
        formState: { errors },
    } = useFormContext();

    return (
        <TextField
            {...register(field.name, {
                required: field.required ? requiredFieldMessage : undefined,
            })}
            {...textfieldProps}
            key={nanoid()}
            label={field.required ? field.label : `${field.label} (Optional)`}
            required={field.required}
            error={!!errors[field.name]}
            helperText={errors[field.name]?.message as string}
            fullWidth
        />
    );
};

const DynamicMDEditor: FC<IDynamicFieldProps> = ({ field }) => {
    const { control } = useFormContext();

    return (
        <Box display="flex" flexDirection="column" gap={1} width="100%">
            <InputLabel required={field.required}>
                {field.required ? field.label : `${field.label} (Optional)`}
            </InputLabel>
            <Box data-color-mode="light" width="100%">
                <Box className="wmde-markdown-var" />
                <Controller
                    name={field.name}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <MDEditor
                            value={value}
                            // @ts-ignore
                            onChange={onChange}
                            previewOptions={{
                                rehypePlugins: [[rehypeSanitize]],
                            }}
                        />
                    )}
                />
            </Box>
        </Box>
    );
};

const DynamicSelect: FC<IDynamicFieldProps> = ({ field }) => {
    const {
        control,
        formState: { errors },
    } = useFormContext();

    return (
        <FormControl required={field.required} fullWidth>
            <InputLabel id={field.label}>{field.label}</InputLabel>
            <Controller
                name={field.name}
                control={control}
                render={({ field: { value, onChange } }) => (
                    <Select
                        value={value}
                        labelId={field.label}
                        label={
                            field.required
                                ? field.label
                                : `${field.label} (Optional)`
                        }
                        onChange={onChange}
                        required={field.required}
                    >
                        {field?.options?.map((option) => (
                            <MenuItem key={nanoid()} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                )}
            />
            {!!errors[field.name] && (
                <FormHelperText error>
                    {errors[field.name]?.message as string}
                </FormHelperText>
            )}
        </FormControl>
    );
};

const DynamicDatePicker: FC<IDynamicFieldProps> = ({ field }) => {
    const {
        control,
        formState: { errors },
    } = useFormContext();

    return (
        <Controller
            name={field.name}
            control={control}
            render={({ field: { onChange, ...restField } }) => (
                <DatePicker
                    {...restField}
                    onChange={(event) => {
                        onChange(event);
                    }}
                    slotProps={{
                        textField: {
                            label: field.required
                                ? field.label
                                : `${field.label} (Optional)`,
                            fullWidth: true,
                            required: field.required,
                            error: !!errors[field.name],
                            helperText: errors[field.name]?.message as string,
                        },
                        actionBar: {
                            actions: ["clear", "today"],
                        },
                    }}
                />
            )}
        />
    );
};

const DynamicFileInput: FC<IDynamicFieldProps> = ({ field }) => {
    const { setValue } = useFormContext();

    const [files, setFiles] = useState<File[]>([]);

    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: FileRejection[]) => {
            fileRejections.forEach((file) => {
                file.errors.forEach((error) => {
                    toast.error(error.message);
                });
            });

            if (acceptedFiles.length === 0) return;

            setFiles([...files, ...acceptedFiles]);
            setValue(field.name, [...files, ...acceptedFiles]);
        },
        [field.name, files, setValue],
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        multiple: true,
        maxFiles: 30,
    });

    const handleClickDelete = (_file: File) => {
        setFiles(files.filter((file) => file.name !== _file.name));
    };

    return (
        <Box display="flex" flexDirection="column" gap={1} width="100%">
            <InputLabel>{field.label}</InputLabel>

            <Box
                display="flex"
                flexDirection="column"
                gap={1}
                alignItems="flex-start"
                width="100%"
            >
                <input {...getInputProps()} />

                <Box
                    {...getRootProps()}
                    sx={(theme) => ({
                        borderWidth: "1px",
                        borderStyle: "dashed",
                        borderColor: isDragActive
                            ? theme.palette.primary.main
                            : "#CCCCCC",
                        borderRadius: "8px",
                        width: "100%",
                        height: "100px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    })}
                >
                    <Box>
                        {isDragActive ? (
                            "Drop files here"
                        ) : (
                            <Box>
                                Drag and drop files, paste screenshots, or{" "}
                                <Link sx={{ cursor: "pointer" }} onClick={open}>
                                    browse
                                </Link>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            <Box display="flex" gap={0.5} width="100%" flexWrap="wrap">
                {files.map((file) => (
                    <FileCard
                        key={file.name}
                        file={file}
                        onDelete={handleClickDelete}
                    />
                ))}
            </Box>
        </Box>
    );
};

interface IDynamicFormProps {
    fields: ServiceFieldT[];
}

const DynamicForm: FC<IDynamicFormProps> = ({ fields }) => {
    return fields.map((field) => {
        if (field.type === "string")
            return <DynamicTextField key={nanoid()} field={field} />;
        if (field.type === "text")
            return <DynamicMDEditor key={nanoid()} field={field} />;
        if (field.type === "number")
            return (
                <DynamicTextField
                    key={nanoid()}
                    field={field}
                    textfieldProps={{
                        type: "number",
                    }}
                />
            );
        if (field.type === "date")
            return <DynamicDatePicker key={nanoid()} field={field} />;
        if (field.type === "select")
            return <DynamicSelect key={nanoid()} field={field} />;
        if (field.type === "file")
            return <DynamicFileInput key={nanoid()} field={field} />;
        return null;
    });
};

export { DynamicForm };
