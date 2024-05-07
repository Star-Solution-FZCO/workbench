import { Box, Typography } from "@mui/material";
import { FormReduxSelectField } from "_components";
import { FC } from "react";
import { Link } from "react-router-dom";
import { SelectOptionT } from "types";
import EditableWrapper from "./editable_wrapper";

const TeamLink: FC<{ data?: SelectOptionT | null }> = ({ data }) => {
    return (
        <Link
            to={`/teams/view/${data?.value}/${data?.label?.replaceAll(
                " ",
                "+",
            )}`}
            style={{
                textDecoration: "none",
            }}
        >
            <Typography
                sx={{
                    color: "#0052cc",
                    "&:hover": {
                        textDecoration: "underline",
                    },
                }}
            >
                {data?.label}
            </Typography>
        </Link>
    );
};

export interface ISelectFieldProps {
    label: string;
    name: string;
    editMode: boolean;
    metadata: any;
    data: SelectOptionT | null | undefined;
    onChangeEditMode: () => void;
    optionsLoadFn: any;
}

const SelectField: FC<ISelectFieldProps> = (props) => {
    const { name, label, data, optionsLoadFn } = props;

    const teamfilterOption = () => true;

    return (
        <EditableWrapper
            value={data}
            {...props}
            editModeChildren={
                <FormReduxSelectField
                    name={name}
                    label={label}
                    optionsLoadFn={optionsLoadFn}
                    isClearable
                    filterOption={
                        name === "team" ? teamfilterOption : undefined
                    }
                />
            }
            previewChildren={
                <Box display="flex" alignItems="center" gap={1}>
                    {name === "team" ? (
                        <TeamLink data={data} />
                    ) : (
                        <Typography>{data?.label}</Typography>
                    )}
                </Box>
            }
        />
    );
};

export default SelectField;
