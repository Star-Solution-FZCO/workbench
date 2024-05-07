import { Box, Typography } from "@mui/material";
import { FormReduxListSelectField } from "_components";
import { FC } from "react";
import { SelectOptionT } from "types";
import EditableWrapper from "./editable_wrapper";
import { ISelectFieldProps } from "./select_field";

interface ISelectListFieldProps extends Omit<ISelectFieldProps, "data"> {
    data: SelectOptionT[] | null;
}

const SelectListField: FC<ISelectListFieldProps> = (props) => {
    const { name, label, data, optionsLoadFn } = props;

    return (
        <EditableWrapper
            value={data}
            {...props}
            editModeChildren={
                <FormReduxListSelectField
                    name={name}
                    label={label}
                    optionsLoadFn={optionsLoadFn}
                    clearable
                />
            }
            previewChildren={
                <Box display="flex" flexDirection="column" gap={1}>
                    {data?.map((item) => (
                        <Typography key={item.value}>{item.label}</Typography>
                    ))}
                </Box>
            }
        />
    );
};

export default SelectListField;
