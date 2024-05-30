import { createApi } from "@reduxjs/toolkit/query/react";
import { apiVersion } from "config";
import {
    ApiResponse,
    CounteragentCredentialsT,
    CounteragentT,
    CustomBaseQueryFn,
    EmployeeHierarchyT,
    EmployeeHistoryRecordT,
    EmployeeSelectOptionT,
    EmployeeT,
    ListRequestParamsT,
    ListResponseT,
    NewCounteragentT,
    NewEmployeeT,
    NewTeamT,
    ProfileModelT,
    SelectOptionT,
    TeamHierarchyT,
    TeamHistoryRecordT,
    TeamT,
    UpdateCounteragentT,
    UpdateEmployeeT,
    UpdateTeamT,
} from "types";
import { saveFile } from "utils";
import customFetchBase from "./custom_fetch_base";

const tagTypes = [
    "Employee",
    "Employees",
    "Profile",
    "Team",
    "Teams",
    "Counteragent",
    "Counteragents",
    "CounteragentsCredentialsItem",
    "CounteragentsCredentialsList",
];

export const employeesApi = createApi({
    reducerPath: "employeesApi",
    baseQuery: customFetchBase as CustomBaseQueryFn,
    tagTypes,
    endpoints: (build) => ({
        // employees
        listEmployeeSelect: build.query<EmployeeSelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/employee/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<EmployeeSelectOptionT[]>) =>
                result.payload,
            providesTags: ["Employees"],
        }),
        listEmployee: build.query<
            ApiResponse<ListResponseT<EmployeeT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/employee/list`,
                params,
            }),
            providesTags: ["Employees"],
        }),
        getEmployee: build.query<ApiResponse<EmployeeT>, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/employee/${id}`,
            }),
            providesTags: ["Employee"],
        }),
        createEmployee: build.mutation<
            ApiResponse<{ id: number }>,
            NewEmployeeT
        >({
            query: (body) => ({
                url: `${apiVersion}/employee`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Employee", "Employees", "Team"],
        }),
        updateEmployee: build.mutation<
            ApiResponse<{ id: number }>,
            UpdateEmployeeT
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/employee/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: [
                "Employee",
                "Employees",
                "Team",
                "Teams",
                "Profile",
            ],
        }),
        watchEmployee: build.mutation<ApiResponse<{ id: number }>, number>({
            query: (id) => ({
                url: `${apiVersion}/employee/${id}/watch`,
                method: "POST",
            }),
            invalidatesTags: ["Employee", "Employees"],
        }),
        unwatchEmployee: build.mutation<ApiResponse<{ id: number }>, number>({
            query: (id) => ({
                url: `${apiVersion}/employee/${id}/watch`,
                method: "DELETE",
            }),
            invalidatesTags: ["Employee", "Employees"],
        }),
        listEmployeeRoleSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/employee/select/role`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
            providesTags: [],
        }),
        dismissEmployee: build.mutation<ApiResponse<{ id: number }>, number>({
            query: (id) => ({
                url: `${apiVersion}/employee/${id}`,
                method: "DELETE",
                body: { id },
            }),
            invalidatesTags: [
                "Employee",
                "Employees",
                "Team",
                "Teams",
                "Profile",
            ],
        }),
        getEmployeeHistory: build.query<
            ApiResponse<ListResponseT<EmployeeHistoryRecordT>>,
            ListRequestParamsT & { id: number; field: string }
        >({
            query: ({ id, ...params }) => ({
                url: `${apiVersion}/employee/${id}/history`,
                params,
            }),
            providesTags: ["Employee"],
        }),
        listEmployeeUpdateManagersSelect: build.query<
            EmployeeSelectOptionT[],
            string
        >({
            query: (search) => ({
                url: `${apiVersion}/employee/select/managers/update`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<EmployeeSelectOptionT[]>) =>
                result.payload,
            providesTags: ["Employees"],
        }),
        listEmployeeUpdateMentorsSelect: build.query<
            EmployeeSelectOptionT[],
            string
        >({
            query: (search) => ({
                url: `${apiVersion}/employee/select/mentors/update`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<EmployeeSelectOptionT[]>) =>
                result.payload,
            providesTags: ["Employees"],
        }),
        updateEmployeePhoto: build.mutation<
            ApiResponse<{ id: number }>,
            { id: number; body: FormData }
        >({
            query: ({ id, body }) => ({
                url: `${apiVersion}/employee/${id}/photo`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Profile", "Employee"],
        }),
        deleteEmployeePhoto: build.mutation<
            ApiResponse<{ id: number }>,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/employee/${id}/photo`,
                method: "DELETE",
            }),
            invalidatesTags: ["Profile", "Employee"],
        }),
        getProfile: build.query<ApiResponse<ProfileModelT>, void>({
            query: () => ({
                url: `${apiVersion}/profile`,
            }),
            providesTags: ["Profile"],
        }),
        exportEmployees: build.query<any, ListRequestParamsT>({
            query: (params) => ({
                url: `${apiVersion}/employee/export`,
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(blob, "export.csv");
                        });
                        return {};
                    }

                    const data = await response.json();

                    return {
                        status: response.status,
                        ...data,
                    };
                },
                cache: "no-cache",
                params,
            }),
        }),
        getEmployeeHierarchy: build.query<EmployeeHierarchyT, number>({
            query: (id) => ({
                url: `${apiVersion}/employee/${id}/hierarchy`,
            }),
            transformResponse: (result: ApiResponse<EmployeeHierarchyT>) =>
                result.payload,
        }),
        getEmployeeFullHierarchy: build.query<EmployeeHierarchyT, void>({
            query: () => ({
                url: `${apiVersion}/employee/hierarchy`,
            }),
            transformResponse: (result: ApiResponse<EmployeeHierarchyT>) =>
                result.payload,
        }),
        // teams
        listTeamSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/team/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
            providesTags: ["Teams"],
        }),
        listTeam: build.query<
            ApiResponse<ListResponseT<TeamT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/team/list`,
                params,
            }),
            providesTags: ["Teams"],
        }),
        getTeam: build.query<ApiResponse<TeamT>, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/team/${id}`,
            }),
            providesTags: ["Team"],
        }),
        getTeamMembers: build.query<
            ApiResponse<ListResponseT<EmployeeT>>,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/team/${id}/members`,
            }),
            providesTags: ["Team"],
        }),
        exportTeamMembers: build.query<unknown, number>({
            query: (id) => ({
                url: `${apiVersion}/team/${id}/members/export`,
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(blob, "export.csv");
                        });
                        return {};
                    }
                    const data = await response.json();

                    return {
                        status: response.status,
                        ...data,
                    };
                },
                cache: "no-cache",
            }),
        }),
        getTeamHistory: build.query<
            ApiResponse<ListResponseT<TeamHistoryRecordT>>,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/team/${id}/history`,
            }),
            providesTags: ["Team"],
        }),
        exportTeamHistory: build.query<unknown, number>({
            query: (id) => ({
                url: `${apiVersion}/team/${id}/history/export`,
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(blob, "export.csv");
                        });
                        return {};
                    }
                    const data = await response.json();

                    return {
                        status: response.status,
                        ...data,
                    };
                },
                cache: "no-cache",
            }),
        }),
        createTeam: build.mutation<{ id: number }, NewTeamT>({
            query: (body) => ({
                url: `${apiVersion}/team`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Teams"],
        }),
        updateTeam: build.mutation<{ success: boolean }, UpdateTeamT>({
            query: (data) => {
                const { id, ...body } = data;
                return {
                    url: `${apiVersion}/team/${id}`,
                    method: "PUT",
                    body,
                };
            },
            invalidatesTags: ["Team", "Teams"],
        }),
        archiveTeam: build.mutation<{ id: number }, number>({
            query: (id) => ({
                url: `${apiVersion}/team/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Team", "Teams"],
        }),
        restoreTeam: build.mutation<{ id: number }, number>({
            query: (id) => ({
                url: `${apiVersion}/team/${id}/restore`,
                method: "PUT",
            }),
            invalidatesTags: ["Team", "Teams"],
        }),
        getTeamHierarchy: build.query<ApiResponse<TeamHierarchyT>, void>({
            query: () => ({
                url: `${apiVersion}/team/hierarchy`,
            }),
            providesTags: ["Teams"],
        }),
        // counteragents
        listCounteragentSelect: build.query<EmployeeSelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/counteragent/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<EmployeeSelectOptionT[]>) =>
                result.payload,
            providesTags: ["Counteragents"],
        }),
        listCounteragent: build.query<
            ApiResponse<ListResponseT<CounteragentT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/counteragent/list`,
                params,
            }),
            providesTags: ["Counteragents"],
        }),
        getCounteragent: build.query<ApiResponse<CounteragentT>, number>({
            query: (id) => ({
                url: `${apiVersion}/counteragent/${id}`,
            }),
            providesTags: ["Counteragent"],
        }),
        createCounteragent: build.mutation<
            ApiResponse<{ id: number }>,
            NewCounteragentT
        >({
            query: (body) => ({
                url: `${apiVersion}/counteragent`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Counteragent", "Counteragents"],
        }),
        updateCounteragent: build.mutation<
            ApiResponse<{ id: number }>,
            UpdateCounteragentT
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/counteragent/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Counteragent", "Counteragents"],
        }),
        bulkInvalidateCounteragent: build.mutation<
            ApiResponse<string>,
            { agents: number[]; apply_subagents: boolean }
        >({
            query: (body) => ({
                url: `${apiVersion}/counteragent/invalidate`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Counteragent", "Counteragents"],
        }),
        bulkRestoreCounteragent: build.mutation<
            ApiResponse<string>,
            { agents: number[]; apply_subagents: boolean }
        >({
            query: (body) => ({
                url: `${apiVersion}/counteragent/restore`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Counteragent", "Counteragents"],
        }),
        bulkSuspendCounteragent: build.mutation<
            ApiResponse<string>,
            { agents: number[]; apply_subagents: boolean }
        >({
            query: (body) => ({
                url: `${apiVersion}/counteragent/suspend`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Counteragent", "Counteragents"],
        }),
        getTeamCounteragents: build.query<
            ApiResponse<ListResponseT<CounteragentT>>,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/team/${id}/counteragents`,
            }),
        }),
        exportCounteragents: build.query<any, ListRequestParamsT>({
            query: (params) => ({
                url: `${apiVersion}/counteragent/export`,
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(blob, "export.csv");
                        });
                        return {};
                    }

                    const data = await response.json();

                    return {
                        status: response.status,
                        ...data,
                    };
                },
                cache: "no-cache",
                params,
            }),
        }),
        listCounteragentCredentials: build.query<
            ApiResponse<ListResponseT<CounteragentCredentialsT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/counteragent/credentials/list`,
                params,
            }),
            providesTags: ["CounteragentsCredentialsList"],
        }),
        getCounteragentCredentials: build.query<
            ApiResponse<CounteragentCredentialsT>,
            number
        >({
            query: (id) => ({
                url: `${apiVersion}/counteragent/${id}/credentials`,
            }),
            providesTags: ["CounteragentsCredentialsItem"],
        }),
        createCounteragentCredentials: build.mutation<
            ApiResponse<{ rid: string }>,
            {
                id: number;
                notifications: Array<{ type: number; value: string }>;
                bundle: Record<string, boolean>;
                ca: number;
            }
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/counteragent/${id}/credentials`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["CounteragentsCredentialsList"],
        }),
        uploadCounteragentCredentials: build.mutation<
            ApiResponse<string>,
            {
                id: number;
                type: string;
                url: string;
            }
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/counteragent/credentials/${id}/upload`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["CounteragentsCredentialsList"],
        }),
        registerEmployee: build.mutation<
            ApiResponse<{ register_token: string }>,
            number
        >({
            query: (id) => ({
                url: `${apiVersion}/employee/${id}/register`,
                method: "PUT",
            }),
        }),
    }),
});
