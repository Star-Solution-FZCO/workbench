import { UseQuery } from "@reduxjs/toolkit/dist/query/react/buildHooks";
import { QueryDefinition } from "@reduxjs/toolkit/query";
import React, { useState } from "react";
import { Controller } from "react-hook-form";
import Select from "react-select";
import { SelectOptionT } from "types/index";
import {
    BaseSelectFieldPropsT,
    FormReduxListSelectFieldPropsT,
    ListSelectField,
} from "./list_select";

type ReduxListSelectFieldPropsT = BaseSelectFieldPropsT & {
    onChange: (value: SelectOptionT[]) => void;
    optionsLoadFn: UseQuery<QueryDefinition<any, any, any, any>>;
};
export const CreatableReduxListSelectField = React.forwardRef<
    Select,
    ReduxListSelectFieldPropsT
>(({ optionsLoadFn, ...props }, ref) => {
    const [search, setSearch] = useState("");
    const { data, isUninitialized, isLoading } = optionsLoadFn(search);
    const handleCreate = (value: string) =>
        props.onChange([...props.value, { value, label: value }]);
    return (
        <ListSelectField
            options={data || []}
            {...props}
            isLoading={isUninitialized || isLoading}
            onSearch={setSearch}
            ref={ref}
            onCreateOption={handleCreate}
        />
    );
});
export const FormCreatableReduxListSelectField: React.FC<
    FormReduxListSelectFieldPropsT
> = ({ name, control, rules, ...props }) => (
    <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
            <CreatableReduxListSelectField {...props} {...field} />
        )}
    />
);
