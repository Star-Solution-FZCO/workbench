import { Box } from "@mui/material";
import { UseQuery } from "@reduxjs/toolkit/dist/query/react/buildHooks";
import { QueryDefinition } from "@reduxjs/toolkit/query";
import { Employee, EmployeeFormReduxListSelectField } from "_components";
import { employeesApi } from "_redux";
import { FC } from "react";
import { EmployeeSelectOptionT } from "types";
import EditableWrapper from "./editable_wrapper";
import { ISelectFieldProps } from "./select_field";

interface IEmployeeListFieldProps
    extends Omit<ISelectFieldProps, "data" | "optionsLoadFn"> {
    label: string;
    name: string;
    editMode: boolean;
    metadata: any;
    data: EmployeeSelectOptionT[];
    onChangeEditMode: () => void;
    optionsLoadFn?: UseQuery<QueryDefinition<any, any, any, any, any>>;
}

const EmployeeListField: FC<IEmployeeListFieldProps> = (props) => {
    const { name, data } = props;

    return (
        <EditableWrapper
            value={data}
            {...props}
            editModeChildren={
                <EmployeeFormReduxListSelectField
                    name={name}
                    optionsLoadFn={
                        props.optionsLoadFn ??
                        employeesApi.useListEmployeeSelectQuery
                    }
                    clearable
                />
            }
            previewChildren={
                <Box display="flex" flexDirection="column" gap={1}>
                    {data.map((employee) => (
                        <Employee
                            key={employee.value}
                            employee={{
                                id: employee.value as number,
                                english_name: employee.label,
                                pararam: employee.pararam || null,
                            }}
                        />
                    ))}
                </Box>
            }
        />
    );
};

export default EmployeeListField;
