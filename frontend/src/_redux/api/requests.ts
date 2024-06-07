import { createApi } from "@reduxjs/toolkit/query/react";
import { apiVersion } from "config";
import {
    AddEmployeeRequest,
    ApiResponse,
    CreateEmployeeT,
    CreateJoinTeamRequestT,
    CustomBaseQueryFn,
    DismissEmployeeRequest,
    EmployeeSelectOptionT,
    ListRequestParamsT,
    ListResponseT,
    NewOnboardingData,
    OnboardingData,
    OnboardingSettingsT,
    RequestModelT,
    SelectOptionT,
    UpdateOnboardingSettingsT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = [
    "AddEmployeeRequest",
    "AddEmployeeRequests",
    "DismissEmployeeRequest",
    "DismissEmployeeRequests",
    "JoinTeamRequest",
    "JoinTeamRequests",
    "OnboardingSettings",
];

export const requestsApi = createApi({
    reducerPath: "requestsApi",
    baseQuery: customFetchBase as CustomBaseQueryFn,
    tagTypes,
    endpoints: (build) => ({
        // requests
        listJoinTeamRequest: build.query<
            ApiResponse<ListResponseT<RequestModelT<any>>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/request/join-team/list`,
                params,
            }),
            providesTags: ["JoinTeamRequests"],
        }),
        getJoinTeamRequest: build.query<RequestModelT<any>, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/request/join-team/${id}`,
            }),
            providesTags: ["JoinTeamRequest"],
            transformResponse: (result: ApiResponse<RequestModelT<any>>) =>
                result.payload,
        }),
        createJoinTeamRequest: build.mutation<
            ApiResponse<{ id: number }>,
            { data: CreateJoinTeamRequestT }
        >({
            query: ({ data }) => ({
                url: `${apiVersion}/request/join-team`,
                method: "POST",
                body: { type: "JOIN_TEAM", data },
            }),
            invalidatesTags: ["JoinTeamRequest", "JoinTeamRequests"],
        }),
        approveJoinTeamRequest: build.mutation<
            ApiResponse<{ id: number }>,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/request/join-team/${id}/approve`,
                method: "PUT",
            }),
            invalidatesTags: ["JoinTeamRequest", "JoinTeamRequests"],
        }),
        cancelJoinTeamRequest: build.mutation<
            ApiResponse<{ id: number }>,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/request/join-team/${id}/cancel`,
                method: "PUT",
            }),
            invalidatesTags: ["JoinTeamRequest", "JoinTeamRequests"],
        }),
        bulkCloseJoinTeamRequest: build.mutation<
            ApiResponse<{ id: number }>,
            { ids: number[]; reason: string }
        >({
            query: (body) => ({
                url: `${apiVersion}/request/join-team/close`,
                method: "DELETE",
                body,
            }),
            invalidatesTags: ["JoinTeamRequest", "JoinTeamRequests"],
        }),
        selectRequestTypes: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/request/select/types`,
                ...(search ? { params: { search } } : {}),
            }),
            providesTags: ["JoinTeamRequests"],
            transformResponse: (result: ApiResponse<EmployeeSelectOptionT[]>) =>
                result.payload,
        }),
        selectJoinTeamRequests: build.query<
            SelectOptionT[],
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/request/join-team/list`,
                params,
            }),
            providesTags: ["JoinTeamRequests"],
            transformResponse: (
                resp: ApiResponse<ListResponseT<RequestModelT<any>>>,
            ) =>
                resp.payload.items.map((item) => ({
                    value: item.id,
                    label: item.subject,
                })),
        }),
        listAddEmployeeRequest: build.query<
            ApiResponse<ListResponseT<AddEmployeeRequest>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/request/add-employee/list`,
                params,
            }),
            providesTags: ["AddEmployeeRequests"],
        }),
        getAddEmployeeRequest: build.query<AddEmployeeRequest, number>({
            query: (id) => ({
                url: `${apiVersion}/request/add-employee/${id}`,
            }),
            providesTags: ["AddEmployeeRequest"],
            transformResponse: (result: ApiResponse<AddEmployeeRequest>) =>
                result.payload,
        }),
        createAddEmployeeRequest: build.mutation<
            ApiResponse<{ id: number }>,
            {
                employee_data: CreateEmployeeT;
                onboarding_data: NewOnboardingData;
            }
        >({
            query: (data) => ({
                url: `${apiVersion}/request/add-employee`,
                method: "POST",
                body: { type: "ADD_EMPLOYEE", ...data },
            }),
            invalidatesTags: ["AddEmployeeRequest", "AddEmployeeRequests"],
        }),
        updateAddEmployeeRequest: build.mutation<
            ApiResponse<{ id: number }>,
            {
                id: number;
                employee_data: CreateEmployeeT;
                onboarding_data: OnboardingData;
            }
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/request/add-employee/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["AddEmployeeRequest", "AddEmployeeRequests"],
        }),
        approveAddEmployeeRequest: build.mutation<
            ApiResponse<{ id: number }>,
            { id: number; role: string }
        >({
            query: ({ id, role }) => ({
                url: `${apiVersion}/request/add-employee/${id}/approve`,
                method: "PUT",
                body: { role },
            }),
            invalidatesTags: ["AddEmployeeRequest", "AddEmployeeRequests"],
        }),
        cancelAddEmployeeRequest: build.mutation<
            ApiResponse<{ id: number }>,
            number
        >({
            query: (id) => ({
                url: `${apiVersion}/request/add-employee/${id}/cancel`,
                method: "PUT",
            }),
            invalidatesTags: ["AddEmployeeRequest", "AddEmployeeRequests"],
        }),
        restoreAddEmployeeRequest: build.mutation<
            ApiResponse<{ id: number }>,
            number
        >({
            query: (id) => ({
                url: `${apiVersion}/request/add-employee/${id}/restore`,
                method: "PUT",
            }),
            invalidatesTags: ["AddEmployeeRequest", "AddEmployeeRequests"],
        }),
        listDismissEmployeeRequest: build.query<
            ApiResponse<ListResponseT<DismissEmployeeRequest>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/request/dismiss-employee/list`,
                params,
            }),
            providesTags: ["DismissEmployeeRequests"],
        }),
        getDismissEmployeeRequest: build.query<DismissEmployeeRequest, number>({
            query: (id) => ({
                url: `${apiVersion}/request/dismiss-employee/${id}`,
            }),
            providesTags: ["DismissEmployeeRequest"],
            transformResponse: (result: ApiResponse<DismissEmployeeRequest>) =>
                result.payload,
        }),
        createDismissEmployeeRequest: build.mutation<
            ApiResponse<{ id: number }>,
            {
                employee_id: number;
                dismiss_datetime: string;
                description?: string;
            }
        >({
            query: (body) => ({
                url: `${apiVersion}/request/dismiss-employee`,
                method: "POST",
                body: { type: "DISMISS_EMPLOYEE", ...body },
            }),
            invalidatesTags: [
                "DismissEmployeeRequest",
                "DismissEmployeeRequests",
            ],
        }),
        updateDismissEmployeeRequest: build.mutation<
            ApiResponse<{ id: number }>,
            {
                id: number;
                dismiss_datetime?: string;
                description?: string | null;
            }
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/request/dismiss-employee/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: [
                "DismissEmployeeRequest",
                "DismissEmployeeRequests",
            ],
        }),
        approveDismissEmployeeRequest: build.mutation<
            ApiResponse<{ id: number }>,
            { id: number; checklist_checked: boolean }
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/request/dismiss-employee/${id}/approve`,
                method: "PUT",
                body,
            }),
            invalidatesTags: [
                "DismissEmployeeRequest",
                "DismissEmployeeRequests",
            ],
        }),
        cancelDismissEmployeeRequest: build.mutation<
            ApiResponse<{ id: number }>,
            number
        >({
            query: (id) => ({
                url: `${apiVersion}/request/dismiss-employee/${id}/cancel`,
                method: "PUT",
            }),
            invalidatesTags: [
                "DismissEmployeeRequest",
                "DismissEmployeeRequests",
            ],
        }),
        getEmployeeRequestSettings: build.query<
            ApiResponse<OnboardingSettingsT>,
            void
        >({
            query: () => ({
                url: `${apiVersion}/request/management-settings`,
            }),
            providesTags: ["OnboardingSettings"],
        }),
        updateEmployeeRequestSettings: build.mutation<
            ApiResponse<OnboardingSettingsT>,
            UpdateOnboardingSettingsT
        >({
            query: (body) => {
                return {
                    url: `${apiVersion}/request/management-settings`,
                    method: "PUT",
                    body,
                };
            },
            invalidatesTags: ["OnboardingSettings"],
        }),
    }),
});
