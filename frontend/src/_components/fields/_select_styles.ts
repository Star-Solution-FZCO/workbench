import { CSSObjectWithLabel } from "react-select";

export const selectStyles = {
    control: (base: CSSObjectWithLabel) => ({
        ...base,
        marginTop: 5,
        border: 0,
        borderWidth: 0,
        boxShadow: "none",
        height: "100%",
    }),
    valueContainer: (base: CSSObjectWithLabel) => ({
        ...base,
        padding: "2px 8px 2px 0",
    }),
    option: (base: CSSObjectWithLabel) => ({
        ...base,
        backgroundColor: undefined,
        color: undefined,
    }),
};
