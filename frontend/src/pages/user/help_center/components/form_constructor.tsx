import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { FC, memo } from "react";
import {
    DragDropContext,
    Draggable,
    DropResult,
    Droppable,
} from "react-beautiful-dnd";
import { ServiceFieldT } from "types";

const generateField = (): ServiceFieldT => ({
    key: nanoid(),
    name: "field",
    label: "Field",
    type: "string",
    required: true,
});

interface ISelectFieldProps {
    index: number;
    value: string;

    onChange: (index: number, value: string) => void;
    onDelete: (index: number) => void;
}

const SelectField: FC<ISelectFieldProps> = ({
    index,
    value,
    onChange,
    onDelete,
}) => {
    return (
        <Box display="flex" gap={1} alignItems="center">
            <TextField
                value={value}
                onChange={(e) => onChange(index, e.target.value)}
                size="small"
                fullWidth
            />

            <Button
                onClick={() => onDelete(index)}
                variant="outlined"
                size="small"
                color="error"
            >
                <DeleteIcon />
            </Button>
        </Box>
    );
};

interface IFormFieldProps {
    index: number;
    field: ServiceFieldT;
    fields: ServiceFieldT[];
    onChange: (fields: ServiceFieldT[]) => void;
    onDelete: (field: ServiceFieldT) => void;
}

const FormField: FC<IFormFieldProps> = memo(
    ({ index, field, fields, onChange, onDelete }) => {
        const handleChangeField = (
            index: number,
            property: string,
            value: any,
        ) => {
            const newFields = [...fields];
            newFields[index] = {
                ...newFields[index],
                [property]: value,
            };

            if (property === "type" && value === "file") {
                newFields[index]["name"] = "attachments";
                newFields[index]["label"] = "Attachments";
            }

            if (property === "select") {
                newFields[index]["options"] = [];
            } else {
                delete newFields[index]["options"];
            }

            onChange(newFields);
        };

        const handleAddOption = () => {
            const newFields = [...fields];
            const options = newFields[index]["options"] || [];
            newFields[index] = {
                ...newFields[index],
                options: [...options, ""],
            };
            onChange(newFields);
        };

        const handleEditOption = (optionIndex: number, value: string) => {
            const newFields = [...fields];
            const options = newFields[index]["options"];

            if (!options) return;

            options[optionIndex] = value;

            newFields[index] = {
                ...newFields[index],
                options,
            };
            onChange(newFields);
        };

        const handleDeleteOption = (optionIndex: number) => {
            const newFields = [...fields];
            const options = newFields[index]["options"];

            if (!options) return;

            newFields[index] = {
                ...newFields[index],
                options: options.filter((_, index) => index !== optionIndex),
            };
            onChange(newFields);
        };

        return (
            <Draggable draggableId={field.key} index={index}>
                {/* @ts-ignore */}
                {(provided, shapshot) => (
                    <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                backgroundColor: shapshot.isDragging
                                    ? "#75DDDD"
                                    : "#fff",
                                border: "1px solid #ccc",
                                borderRadius: 1,
                                pt: 2,
                                p: 1,
                                ...(shapshot.isDragging && {
                                    transform: "rotate(3deg)",
                                }),
                            }}
                        >
                            <Box
                                flex={1}
                                display="flex"
                                flexDirection="column"
                                gap={1}
                            >
                                <Box display="flex" gap={1}>
                                    <TextField
                                        sx={{
                                            "& .MuiInputBase-root": {
                                                background: "#fff",
                                            },
                                        }}
                                        label="Label"
                                        value={field.label}
                                        onChange={(e) => {
                                            handleChangeField(
                                                index,
                                                "label",
                                                e.target.value,
                                            );
                                        }}
                                        size="small"
                                        fullWidth
                                    />
                                    <TextField
                                        sx={{
                                            "& .MuiInputBase-root": {
                                                background: "#fff",
                                            },
                                        }}
                                        label="Name"
                                        value={field.name}
                                        onChange={(e) =>
                                            handleChangeField(
                                                index,
                                                "name",
                                                e.target.value
                                                    .toLowerCase()
                                                    .replaceAll(" ", "_"),
                                            )
                                        }
                                        size="small"
                                        fullWidth
                                    />
                                </Box>

                                <Box display="flex" gap={1}>
                                    <FormControl sx={{ flex: 1 }}>
                                        <InputLabel
                                            id="type-select"
                                            size="small"
                                        >
                                            Field type
                                        </InputLabel>
                                        <Select
                                            id="type-select"
                                            labelId="type-select"
                                            sx={{
                                                "& .MuiInputBase-input": {
                                                    background: "#fff",
                                                },
                                            }}
                                            label="Field type"
                                            value={field.type}
                                            onChange={(e) =>
                                                handleChangeField(
                                                    index,
                                                    "type",
                                                    e.target.value,
                                                )
                                            }
                                            size="small"
                                        >
                                            <MenuItem value="string">
                                                String
                                            </MenuItem>
                                            <MenuItem value="text">
                                                Text
                                            </MenuItem>
                                            <MenuItem value="number">
                                                Number
                                            </MenuItem>
                                            <MenuItem value="select">
                                                Select
                                            </MenuItem>
                                            <MenuItem value="date">
                                                Date
                                            </MenuItem>
                                            <MenuItem value="file">
                                                File
                                            </MenuItem>
                                        </Select>
                                    </FormControl>

                                    <Box
                                        flex={1}
                                        display="flex"
                                        justifyContent="space-between"
                                        gap={1}
                                    >
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={field.required}
                                                    onChange={(e) =>
                                                        handleChangeField(
                                                            index,
                                                            "required",
                                                            e.target.checked,
                                                        )
                                                    }
                                                    disableRipple
                                                />
                                            }
                                            label="Required"
                                            labelPlacement="start"
                                        />

                                        <Button
                                            sx={{ bgcolor: "#fff" }}
                                            onClick={() => onDelete(field)}
                                            color="error"
                                            variant="outlined"
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </Button>
                                    </Box>
                                </Box>

                                {field.type === "select" && (
                                    <Box
                                        display="flex"
                                        flexDirection="column"
                                        gap={1}
                                        p={1}
                                        border="1px solid #ccc"
                                        borderRadius={1}
                                    >
                                        <Typography>Options</Typography>
                                        <Button
                                            onClick={handleAddOption}
                                            startIcon={<AddIcon />}
                                            variant="outlined"
                                            size="small"
                                            color="success"
                                        >
                                            Add option
                                        </Button>

                                        {field.options?.map((option, index) => (
                                            <SelectField
                                                key={index}
                                                index={index}
                                                value={option}
                                                onChange={handleEditOption}
                                                onDelete={handleDeleteOption}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </Box>

                            <Box
                                {...provided.dragHandleProps}
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                border="1px solid #2396f3"
                                bgcolor="#fff"
                                borderRadius={1}
                                p={1}
                            >
                                <DragHandleIcon color="info" />
                            </Box>
                        </Box>
                    </Box>
                )}
            </Draggable>
        );
    },
);

interface IFormConstructorProps {
    fields: ServiceFieldT[];
    onChange: (fields: ServiceFieldT[]) => void;
}

const FormConstructor: FC<IFormConstructorProps> = ({ fields, onChange }) => {
    const handleClickAdd = () => {
        onChange([...fields, generateField()]);
    };

    const handleDeleteField = (targetField: ServiceFieldT) => {
        const confirmed = confirm(
            `Are you sure you want to delete "${targetField.label}" field?`,
        );
        if (!confirmed) return;
        onChange(fields.filter((field) => field.key !== targetField.key));
    };

    const handleDradEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const variant = fields.find((f) => f.key === draggableId);
        if (!variant) return;

        const newFields = fields.slice();
        newFields.splice(source.index, 1);
        newFields.splice(destination.index, 0, variant);

        onChange(newFields);
    };

    return (
        <Box
            width="50%"
            display="flex"
            flexDirection="column"
            gap={1}
            border="1px solid #ccc"
            borderRadius={1}
            p={1}
        >
            <Typography variant="h6">User fields</Typography>

            {fields.length > 0 ? (
                <DragDropContext onDragEnd={handleDradEnd}>
                    {/* @ts-ignore */}
                    <Droppable droppableId={nanoid()}>
                        {/* @ts-ignore */}
                        {(provided) => (
                            <Box
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                display="flex"
                                flexDirection="column"
                                gap={1}
                                borderRadius={1}
                            >
                                {fields.map((field, index) => (
                                    <FormField
                                        key={field.key}
                                        index={index}
                                        field={field}
                                        fields={fields}
                                        onChange={onChange}
                                        onDelete={handleDeleteField}
                                    />
                                ))}
                                {provided.placeholder}
                            </Box>
                        )}
                    </Droppable>
                </DragDropContext>
            ) : (
                <Typography fontWeight={500}>No fields</Typography>
            )}

            <Button
                onClick={handleClickAdd}
                startIcon={<AddIcon />}
                size="small"
                variant="outlined"
                color="success"
            >
                Add field
            </Button>
        </Box>
    );
};

export { FormConstructor };
