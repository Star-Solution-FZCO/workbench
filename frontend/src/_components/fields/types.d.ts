import { FieldErrorsImpl, RegisterOptions } from "react-hook-form";

export type ControllerT<T> = T & {
    name: string;
    control: any;
    rules?: RegisterOptions;
    errors?: FieldErrorsImpl;
};
