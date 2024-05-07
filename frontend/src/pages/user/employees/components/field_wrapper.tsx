import { Typography } from "@mui/material";
import { FormRow } from "_components/fields";
import { pararamChatURL } from "config";
import { FC } from "react";
import EditableTextField from "./editable_textfield";

const PararamLink: FC<{ pararam?: string | null }> = ({ pararam }) => {
    return pararam ? (
        <a
            href={pararamChatURL + pararam}
            target="_blank"
            rel="noreferrer noopener"
        >
            @{pararam}
        </a>
    ) : (
        <Typography>---</Typography>
    );
};

interface IFieldWrapperProps {
    label: string;
    name: string;
    value?: string | null;
    helperText?: string;
    canBeEdited?: boolean;
}

const FieldWrapper: FC<IFieldWrapperProps> = ({
    label,
    value,
    name,
    helperText,
    canBeEdited,
}) => (
    <FormRow label={label}>
        {canBeEdited ? (
            <EditableTextField
                label={label}
                name={name}
                helperText={helperText}
            />
        ) : name !== "pararam" ? (
            <Typography>{value || "---"}</Typography>
        ) : (
            <PararamLink pararam={value} />
        )}
    </FormRow>
);

export default FieldWrapper;
