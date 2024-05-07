import { AxiosRequestConfig } from "axios";

export type MethodT = "get" | "post" | "put" | "delete";
export type ParamsT = { [key: string]: any };
export type RequestParamsT = AxiosRequestConfig;
export type ResponseT<T, E> = {
    sucess: boolean;
    payload: T;
    error?: E;
};
export type ErrorResponseT<Type> = {
    success: boolean;
    error: Type;
};
export type QueryParamsT = {
    [key: string]: string | number | boolean;
};
