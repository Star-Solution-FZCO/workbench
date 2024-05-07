import { ModelFieldMetadataT } from "types";

export const checkFieldCanBeEdited = (
    fieldName: string,
    metadata?: { fields: ModelFieldMetadataT[] } | null,
) => {
    if (!metadata) return false;
    const field = metadata.fields.find((field) => field.name === fieldName);
    if (!field) return false;
    return field.editable;
};

export const HHmmToDate = (time?: string) => {
    if (!time) return new Date();
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(+hours);
    date.setMinutes(+minutes);
    return date;
};
