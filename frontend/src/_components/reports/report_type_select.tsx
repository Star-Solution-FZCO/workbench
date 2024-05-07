import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
} from "@mui/material";
import { reportsApi } from "_redux";
import { FC } from "react";

interface IReportTypeSelectProps {
    value: any;
    onChange: (event: SelectChangeEvent<any>) => void;
}

const ReportTypeSelect: FC<IReportTypeSelectProps> = ({ value, onChange }) => {
    const { data } = reportsApi.useListEmployeeReportTypeSelectQuery("");

    return (
        <FormControl className="report-type-select">
            <InputLabel id="report-type-select-label">Report type</InputLabel>
            <Select
                label="Report type"
                labelId="report-type-select-label"
                value={value}
                onChange={onChange}
                size="small"
            >
                {data?.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                        {item.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export { ReportTypeSelect };
