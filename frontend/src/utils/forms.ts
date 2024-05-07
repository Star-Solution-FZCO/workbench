import { map, reduce } from "lodash";
import { RegisterOptions } from "react-hook-form";

export const genRules = (rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [name: string]: any;
}): RegisterOptions =>
    reduce(
        rules,
        (p, v, k) => {
            switch (k) {
                case "required":
                    return { ...p, required: "This field is required" };
                case "minLength":
                    return {
                        ...p,
                        minLength: {
                            value: v,
                            message: `must contains at least ${v} chars`,
                        },
                    };
                case "maxLength":
                    return {
                        ...p,
                        maxLength: {
                            value: v,
                            message: `must contains no more than ${v} chars`,
                        },
                    };
                default:
                    return { ...p, [k]: v };
            }
        },
        {},
    );

export const selectFromStringArray = (value: string[]) =>
    map(value, (v) => ({ value: v, label: v }));

export const hasDuplicates = (array: string[]): boolean => {
    return new Set(array).size !== array.length;
};

export const countElement = <T>(array: Array<T>, element: T) => {
    return array.filter((currentElement) => currentElement === element).length;
};
