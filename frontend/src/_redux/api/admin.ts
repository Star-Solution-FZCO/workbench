import { createApi } from "@reduxjs/toolkit/query/react";
import {
    ApiResponse,
    CustomBaseQueryFn,
    EmployeeRequestT,
    ListRequestParamsT,
    ListResponseT,
    RequestModelT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const baseUrl = "v1/admin/request";

export const adminRequestApi = createApi({
    reducerPath: "adminRequestApi",
    baseQuery: customFetchBase as CustomBaseQueryFn,
    tagTypes: ["User", "Request", "Requests"],
    endpoints: (build) => ({
        listRequests: build.query<
            ApiResponse<ListResponseT<RequestModelT<any>>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${baseUrl}/list`,
                params,
            }),
            providesTags: ["Requests"],
        }),
        getRequest: build.query<RequestModelT<any>, { id: number }>({
            query: ({ id }) => ({
                url: `${baseUrl}/${id}`,
            }),
            providesTags: ["Request"],
            transformResponse: (
                result: ApiResponse<RequestModelT<{ [key: string]: any }>>,
            ) => ({
                ...result.payload,
                data: result.payload.data.about
                    ? {
                          ...result.payload.data,
                          about: JSON.parse(result.payload.data.about),
                      }
                    : result.payload.data,
            }),
        }),
        updateRequestData: build.mutation<
            ApiResponse<{ id: number }>,
            EmployeeRequestT & { id: number; reason: string }
        >({
            query: ({ id, reason, ...data }) => ({
                url: `${baseUrl}/${id}/data`,
                method: "PUT",
                body: { reason, ...data, about: JSON.stringify(data.about) },
            }),
            invalidatesTags: ["Request", "Requests"],
        }),
        createEmployeeRequest: build.mutation<
            ApiResponse<{ id: number }>,
            { data: EmployeeRequestT }
        >({
            query: ({ data }) => ({
                url: baseUrl,
                method: "POST",
                body: { type: "EMPLOYEE", data },
            }),
            invalidatesTags: ["Request", "Requests"],
        }),
        bulkCloseRequest: build.mutation<
            ApiResponse<{ id: number }>,
            { ids: number[]; reason: string }
        >({
            query: (body) => ({
                url: `${baseUrl}/close`,
                method: "DELETE",
                body,
            }),
            invalidatesTags: ["Request", "Requests"],
        }),
    }),
});
