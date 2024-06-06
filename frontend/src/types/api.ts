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

export type QueryStringListErrorT = {
    status: number;
    data: {
        detail: string[];
        type?: string;
    };
};

export const isQueryErrorT = (
    error:
        | SerializedError
        | QueryErrorT
        | QueryStringErrorT
        | QueryStringListErrorT,
): boolean => {
    if (!((error as QueryErrorT).data?.detail instanceof Array)) {
        return false;
    }
    if ((error as QueryErrorT).data?.detail.length === 0) {
        return true;
    }
    return (error as QueryErrorT).data?.detail[0] instanceof Object;
};

export const isQueryStringErrorT = (
    error:
        | SerializedError
        | QueryErrorT
        | QueryStringErrorT
        | QueryStringListErrorT,
): boolean => typeof (error as QueryStringErrorT).data?.detail === "string";

export const isQueryStringListErrorT = (
    error:
        | SerializedError
        | QueryErrorT
        | QueryStringErrorT
        | QueryStringListErrorT,
): boolean => {
    if (!((error as QueryErrorT).data?.detail instanceof Array)) {
        return false;
    }
    if ((error as QueryErrorT).data?.detail.length === 0) {
        return true;
    }
    return typeof (error as QueryErrorT).data?.detail[0] === "string";
};

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
