import { englishNameRegExp } from "utils";
import * as yup from "yup";

const selectFieldSchema = yup.object({
    value: yup.lazy((val) =>
        isNaN(val) ? yup.string().required() : yup.number().required(),
    ),
    label: yup.string().required(),
});

export const counteragentSchema = yup
    .object({
        english_name: yup
            .string()
            .required("Required field")
            .matches(
                englishNameRegExp,
                "English name must contain only Latin characters (numbers and special characters ._- allowed in the username)",
            ),
        email: yup.string().email().required("Required field"),
        username: yup.string().default(null).nullable(),
        contacts: yup.array().required("Required field"),
        group: yup.boolean().required("Required field"),
        manager: selectFieldSchema.required("Required field"),
        agents: yup.array().required("Required field"),
        team: selectFieldSchema.default(null).nullable(),
        team_required: yup.boolean().required("Required field"),
        organization: selectFieldSchema.default(null).nullable(),
        schedule: yup.string().required("Required field"),
        apply_subagents: yup.boolean(),
    })
    .required();

export type CounteragentFormData = yup.InferType<typeof counteragentSchema>;
