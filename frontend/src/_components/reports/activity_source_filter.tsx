import { Autocomplete, Checkbox, TextField } from "@mui/material";
import { reportsApi } from "_redux";
import { FC } from "react";
import { useSearchParams } from "react-router-dom";

interface IActivitySourceFilterProps {
    value: any[];
    onChange: (value: any) => void;
}

const ActivitySourceFilter: FC<IActivitySourceFilterProps> = ({
    value,
    onChange,
}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: options } = reportsApi.useListActivitySourceQuery("");

    return (
        <Autocomplete
            options={options || []}
            value={value}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={(_: unknown, newValue: any[]) => {
                onChange(newValue);
                if (newValue.length === 0 && searchParams.has("source")) {
                    searchParams.delete("source");
                    setSearchParams(searchParams);
                }
            }}
            getOptionLabel={(option) => option.label}
            renderOption={(props, option, { selected }) => (
                <li {...props}>
                    <Checkbox checked={selected} />
                    {option.label}
                </li>
            )}
            renderInput={(params) => (
                <TextField {...params} label="Activity source" />
            )}
            size="small"
            limitTags={1}
            sx={{ minWidth: "200px" }}
            disableCloseOnSelect
            multiple
        />
    );
};

export { ActivitySourceFilter };
