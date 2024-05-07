import { SerializedError } from "@reduxjs/toolkit";

type ApiFieldError = {
    loc: string[];
    ctx: { [key: string]: string | number };
    msg: string;
    type: string;
};

export type QueryErrorT = {
    status: number;
    data: {
        detail: ApiFieldError[];
        type?: string;
    };
};

export type QueryStringErrorT = {
    status: number;
    data: {
        detail: string;
        type?: string;
    };
};

export const isQueryErrorT = (
    error: SerializedError | QueryErrorT | QueryStringErrorT,
): boolean => {
    return (error as QueryErrorT).data?.detail instanceof Array;
};

export const isQueryStringErrorT = (
    error: SerializedError | QueryErrorT | QueryStringErrorT,
): boolean => typeof (error as QueryStringErrorT).data?.detail === "string";

export type ListRequestParamsT = {
    filter?: string;
    offset?: number;
    limit?: number;
    sort_by?: string;
    sort_direction?: "desc" | "asc";
};

export type ListResponseT<T> = {
    count: number;
    limit: number;
    offset: number;
    items: T[];
};

export type ApiResponse<T> = {
    success: boolean;
    payload: T;
    metadata?: any;
};

export type ListHelpCenterRequestParamsT = {
    limit: number;
    offset: number;
    status?: "Open" | "Closed";
    requester?: "me" | "participant";
    service?: string;
    search?: string;
};
