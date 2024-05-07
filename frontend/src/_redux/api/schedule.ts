import { createApi } from "@reduxjs/toolkit/query/react";
import { apiVersion } from "config";
import {
    ApiResponse,
    CustomBaseQueryFn,
    EmployeeDayStatusT,
    EmployeeScheduleExclusionMoveT,
    EmployeeScheduleExclusionT,
    EmployeeScheduleT,
    EmployeeVacationCorrectionT,
    ListRequestParamsT,
    ListResponseT,
    MoveEmployeeScheduleExclusionT,
    NewEmployeeScheduleExclusionT,
    NewEmployeeVacationCorrectionT,
    UpdateEmployeeScheduleT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = [
    "EmployeeFreeVacationDays",
    "EmployeeSchedule",
    "EmployeeScheduleVacationExclusion",
    "Exclusion",
    "Exclusions",
];

export const scheduleApi = createApi({
    reducerPath: "scheduleApi",
    baseQuery: customFetchBase as CustomBaseQueryFn,
    tagTypes,
    endpoints: (build) => ({
        getEmployeeSchedule: build.query<
            ApiResponse<EmployeeScheduleT | null>,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/employee/${id}/schedule`,
                method: "GET",
            }),
            providesTags: ["EmployeeSchedule"],
        }),
        listEmployeeSchedule: build.query<
            ApiResponse<ListResponseT<EmployeeScheduleT>>,
            ListRequestParamsT & { id: number }
        >({
            query: ({ id, ...params }) => ({
                url: `${apiVersion}/employee/${id}/schedule/list`,
                params,
            }),
            providesTags: ["EmployeeSchedule"],
        }),
        updateEmployeeSchedule: build.mutation<
            ApiResponse<{ id: number }>,
            Omit<UpdateEmployeeScheduleT, "can_remove">
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/employee/${id}/schedule`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["EmployeeSchedule", "Exclusion", "Exclusions"],
        }),
        deleteEmployeeSchedule: build.mutation<
            ApiResponse<{ id: number }>,
            { id: number; start: string }
        >({
            query: ({ id, start }) => ({
                url: `${apiVersion}/employee/${id}/schedule/${start}`,
                method: "DELETE",
            }),
            invalidatesTags: ["EmployeeSchedule", "Exclusion", "Exclusions"],
        }),
        getEmployeeFreeVacationDays: build.query<
            ApiResponse<{
                free_vacation_days_current: number;
                free_vacation_days_year_end: number;
            }>,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/employee/${id}/schedule/free_vacation_days`,
                method: "GET",
            }),
            providesTags: ["EmployeeFreeVacationDays"],
        }),
        getEmployeeDayStatusList: build.query<
            ApiResponse<EmployeeDayStatusT>,
            { id: number; start: string; end: string }
        >({
            query: ({ id, start, end }) => ({
                url: `${apiVersion}/employee/${id}/day_status`,
                method: "GET",
                params: { start, end },
            }),
            providesTags: ["Exclusion"],
        }),
        getEmployeeScheduleExclusionList: build.query<any, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/employee/${id}/schedule/exclusion/list`,
                method: "GET",
            }),
            providesTags: ["Exclusions"],
        }),
        getEmployeeScheduleExclusionGroupedList: build.query<
            ApiResponse<ListResponseT<EmployeeScheduleExclusionT>>,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/employee/${id}/schedule/exclusion/list/grouped`,
                method: "GET",
            }),
            providesTags: ["Exclusions"],
        }),
        createEmployeeScheduleExclusion: build.mutation<
            { id: number },
            { id: number; exclusion: NewEmployeeScheduleExclusionT }
        >({
            query: ({ id, exclusion }) => ({
                url: `${apiVersion}/employee/${id}/schedule/exclusion`,
                method: "POST",
                body: exclusion,
            }),
            invalidatesTags: [
                "Exclusion",
                "Exclusions",
                "EmployeeFreeVacationDays",
            ],
        }),
        moveEmployeeScheduleExclusion: build.mutation<
            { id: number },
            MoveEmployeeScheduleExclusionT
        >({
            query: ({ employee_id, ...body }) => ({
                url: `${apiVersion}/employee/${employee_id}/schedule/move`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Exclusion", "Exclusions"],
        }),
        updateMovedEmployeeScheduleExclusion: build.mutation<
            { id: number },
            MoveEmployeeScheduleExclusionT & { guid: string }
        >({
            query: ({ employee_id, guid, ...body }) => ({
                url: `${apiVersion}/employee/${employee_id}/schedule/move/${guid}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Exclusion", "Exclusions"],
        }),
        listEmployeeScheduleExclusionMove: build.query<
            ApiResponse<ListResponseT<EmployeeScheduleExclusionMoveT>>,
            ListRequestParamsT & { id: number }
        >({
            query: ({ id, ...params }) => ({
                url: `${apiVersion}/employee/${id}/schedule/move/list`,
                params,
            }),
            providesTags: ["Exclusions"],
        }),
        getDayStatusList: build.query<
            ApiResponse<ListResponseT<EmployeeDayStatusT>>,
            ListRequestParamsT & { start: string; end: string }
        >({
            query: (params) => ({
                url: `${apiVersion}/employee/list/day_status`,
                method: "GET",
                params,
            }),
            serializeQueryArgs: ({ endpointName }) => {
                return endpointName;
            },
            merge: (currentCache, responseData, otherArgs) => {
                if (otherArgs.arg.offset && otherArgs.arg.offset > 0) {
                    currentCache.payload.items.push(
                        ...responseData.payload.items,
                    );
                    return currentCache;
                }
                return responseData;
            },
            forceRefetch({ currentArg, previousArg }) {
                return currentArg !== previousArg;
            },
            providesTags: ["Exclusions"],
        }),
        approveEmployeeScheduleExclusion: build.mutation<
            ApiResponse<{ success: boolean }>,
            { id: number; guid: string }
        >({
            query: (data) => {
                const { id, guid } = data;
                return {
                    url: `${apiVersion}/employee/${id}/schedule/exclusion/${guid}/approve`,
                    method: "PUT",
                };
            },
            invalidatesTags: ["Exclusions", "EmployeeFreeVacationDays"],
        }),
        cancelEmployeeScheduleExclusion: build.mutation<
            ApiResponse<{ success: boolean }>,
            { id: number; guid: string }
        >({
            query: (data) => {
                const { id, guid } = data;
                return {
                    url: `${apiVersion}/employee/${id}/schedule/exclusion/${guid}/cancel`,
                    method: "DELETE",
                };
            },
            invalidatesTags: [
                "Exclusion",
                "Exclusions",
                "EmployeeFreeVacationDays",
            ],
        }),
        cancelOneDayInScheduleExclusion: build.mutation<
            ApiResponse<{ success: boolean }>,
            { id: number; day: string }
        >({
            query: (data) => {
                const { id, day } = data;
                return {
                    url: `${apiVersion}/employee/${id}/schedule/exclusion/cancel/${day}`,
                    method: "DELETE",
                };
            },
            invalidatesTags: [
                "Exclusion",
                "Exclusions",
                "EmployeeFreeVacationDays",
            ],
        }),
        listEmployeeVacationCorrection: build.query<
            ApiResponse<ListResponseT<EmployeeVacationCorrectionT>>,
            ListRequestParamsT & { id: number }
        >({
            query: ({ id, ...params }) => ({
                url: `${apiVersion}/employee/${id}/schedule/vacation_correction/list`,
                params,
            }),
            providesTags: ["EmployeeScheduleVacationExclusion"],
        }),
        createEmployeeVacationCorrection: build.mutation<
            ApiResponse<{ id: number }>,
            { id: number } & NewEmployeeVacationCorrectionT
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/employee/${id}/schedule/vacation_correction`,
                method: "POST",
                body,
            }),
            invalidatesTags: [
                "EmployeeScheduleVacationExclusion",
                "EmployeeFreeVacationDays",
            ],
        }),
        deleteEmployeeVacationCorrection: build.mutation<
            ApiResponse<{ id: number }>,
            { employee_id: number; id: number }
        >({
            query: ({ employee_id, id }) => ({
                url: `${apiVersion}/employee/${employee_id}/schedule/vacation_correction/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: [
                "EmployeeScheduleVacationExclusion",
                "EmployeeFreeVacationDays",
            ],
        }),
    }),
});
