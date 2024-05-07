import { createApi } from "@reduxjs/toolkit/query/react";
import { apiVersion } from "config";
import {
    APITokenT,
    ApiResponse,
    CooperationTypeT,
    CreatedAPITokenT,
    CustomBaseQueryFn,
    EmployeePoolT,
    EmployeeSelectOptionT,
    GradeT,
    HolidaySetT,
    ListRequestParamsT,
    ListResponseT,
    NewAPITokenT,
    NewCooperationTypeT,
    NewEmployeePoolT,
    NewGradeT,
    NewHolidaySetT,
    NewHolidayT,
    NewOrganizationT,
    NewPositionT,
    NewTeamTagT,
    NewUsefulLinkT,
    OrganizationT,
    PositionT,
    SelectOptionT,
    SelectTagOptionT,
    TeamTagT,
    UpdateEmployeePoolT,
    UpdateGradeT,
    UpdateHolidaySetT,
    UpdateTeamTagT,
    UpdateUsefulLinkT,
    UsefulLinkT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = [
    "APIToken",
    "APITokens",
    "CooperationType",
    "CooperationTypes",
    "EmployeePool",
    "EmployeePools",
    "Grade",
    "Grades",
    "HolidaySet",
    "HolidaySets",
    "Organization",
    "Organizations",
    "Position",
    "Positions",
    "TeamTag",
    "TeamTags",
    "UsefulLink",
    "UsefulLinks",
];

export const catalogsApi = createApi({
    reducerPath: "catalogsApi",
    baseQuery: customFetchBase as CustomBaseQueryFn,
    tagTypes,
    endpoints: (build) => ({
        // grade
        listGradeSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/catalog/grade/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
            providesTags: ["Grades"],
        }),
        listGrade: build.query<
            ApiResponse<ListResponseT<GradeT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/catalog/grade/list`,
                params,
            }),
            providesTags: ["Grades"],
        }),
        getGrade: build.query<ApiResponse<GradeT>, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/grade/${id}`,
            }),
            providesTags: ["Grade"],
        }),
        createGrade: build.mutation<GradeT, NewGradeT>({
            query: (body) => ({
                url: `${apiVersion}/catalog/grade`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Grades"],
        }),
        updateGrade: build.mutation<{ success: boolean }, UpdateGradeT>({
            query: (data) => {
                const { id, ...body } = data;
                return {
                    url: `${apiVersion}/catalog/grade/${id}`,
                    method: "PUT",
                    body,
                };
            },
            invalidatesTags: ["Grade", "Grades"],
        }),
        // organizations
        listOrganizationSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/catalog/organization/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<EmployeeSelectOptionT[]>) =>
                result.payload,
            providesTags: ["Organizations"],
        }),
        listOrganization: build.query<
            ApiResponse<ListResponseT<OrganizationT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/catalog/organization/list`,
                params,
            }),
            providesTags: ["Organizations"],
        }),
        getOrganization: build.query<
            ApiResponse<OrganizationT>,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/organization/${id}`,
            }),
            providesTags: ["Organization"],
        }),
        createOrganization: build.mutation<OrganizationT, NewOrganizationT>({
            query: (body) => ({
                url: `${apiVersion}/catalog/organization`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Organizations"],
        }),
        updateOrganization: build.mutation<
            { success: boolean },
            Omit<OrganizationT, "is_archived">
        >({
            query: (data) => {
                const { id, ...body } = data;
                return {
                    url: `${apiVersion}/catalog/organization/${id}`,
                    method: "PUT",
                    body,
                };
            },
            invalidatesTags: ["Organization", "Organizations"],
        }),
        archiveOrganization: build.mutation<OrganizationT, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/organization/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Organization", "Organizations"],
        }),
        restoreOrganization: build.mutation<OrganizationT, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/organization/${id}/restore`,
                method: "PUT",
            }),
            invalidatesTags: ["Organization", "Organizations"],
        }),
        // positions
        listPositionSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/catalog/position/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
            providesTags: ["Positions"],
        }),
        listPositionCategorySelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/catalog/position/select/category`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
        }),
        listPosition: build.query<
            ApiResponse<ListResponseT<PositionT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/catalog/position/list`,
                params,
            }),
            providesTags: ["Positions"],
        }),
        getPosition: build.query<ApiResponse<PositionT>, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/position/${id}`,
            }),
            providesTags: ["Position"],
        }),
        createPosition: build.mutation<PositionT, NewPositionT>({
            query: (body) => ({
                url: `${apiVersion}/catalog/position`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Positions"],
        }),
        updatePosition: build.mutation<
            { success: boolean },
            Omit<PositionT, "is_archived">
        >({
            query: (data) => {
                const { id, ...body } = data;
                return {
                    url: `${apiVersion}/catalog/position/${id}`,
                    method: "PUT",
                    body,
                };
            },
            invalidatesTags: ["Position", "Positions"],
        }),
        archivePosition: build.mutation<PositionT, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/position/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Position", "Positions"],
        }),
        restorePosition: build.mutation<PositionT, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/position/${id}/restore`,
                method: "PUT",
            }),
            invalidatesTags: ["Position", "Positions"],
        }),
        // holidays
        listHolidaySet: build.query<
            ApiResponse<ListResponseT<HolidaySetT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/catalog/holiday_set/list`,
                params,
            }),
            providesTags: ["HolidaySets"],
        }),
        listHolidaySetSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/catalog/holiday_set/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
            providesTags: ["HolidaySets"],
        }),
        getHolidaySet: build.query<ApiResponse<HolidaySetT>, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/holiday_set/${id}`,
            }),
            providesTags: ["HolidaySet"],
        }),
        createHolidaySet: build.mutation<{ id: number }, NewHolidaySetT>({
            query: (body) => ({
                url: `${apiVersion}/catalog/holiday_set`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["HolidaySets"],
        }),
        updateHolidaySet: build.mutation<{ id: number }, UpdateHolidaySetT>({
            query: (data) => {
                const { id, ...body } = data;
                return {
                    url: `${apiVersion}/catalog/holiday_set/${id}`,
                    method: "PUT",
                    body,
                };
            },
            invalidatesTags: ["HolidaySet", "HolidaySets"],
        }),
        setDefaultHolidaySet: build.mutation<{ id: number }, number>({
            query: (id) => {
                const body = { id: id };
                return {
                    url: `${apiVersion}/catalog/holiday_set/set-default`,
                    method: "PUT",
                    body,
                };
            },
            invalidatesTags: ["HolidaySet", "HolidaySets"],
        }),
        createHoliday: build.mutation<
            { id: number },
            { id: number; holiday: NewHolidayT }
        >({
            query: ({ id, holiday }) => ({
                url: `${apiVersion}/catalog/holiday_set/${id}/day`,
                method: "POST",
                body: holiday,
            }),
            invalidatesTags: ["HolidaySet", "HolidaySets", "Exclusions"],
        }),
        deleteHoliday: build.mutation<
            { id: number },
            { id: number; day: string }
        >({
            query: ({ id, day }) => ({
                url: `${apiVersion}/catalog/holiday_set/${id}/day`,
                method: "DELETE",
                params: { day },
            }),
            invalidatesTags: ["HolidaySet", "HolidaySets", "Exclusions"],
        }),
        // cooperation types
        listCooperationTypeSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/catalog/cooperation_type/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
            providesTags: ["CooperationTypes"],
        }),
        listCooperationType: build.query<
            ApiResponse<ListResponseT<CooperationTypeT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/catalog/cooperation_type/list`,
                params,
            }),
            providesTags: ["CooperationTypes"],
        }),
        getCooperationType: build.query<
            ApiResponse<CooperationTypeT>,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/cooperation_type/${id}`,
            }),
            providesTags: ["CooperationType"],
        }),
        createCooperationType: build.mutation<
            CooperationTypeT,
            NewCooperationTypeT
        >({
            query: (body) => ({
                url: `${apiVersion}/catalog/cooperation_type`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["CooperationTypes"],
        }),
        updateCooperationType: build.mutation<
            ApiResponse<{ success: boolean }>,
            Omit<CooperationTypeT, "is_archived">
        >({
            query: (data) => {
                const { id, ...body } = data;
                return {
                    url: `${apiVersion}/catalog/cooperation_type/${id}`,
                    method: "PUT",
                    body,
                };
            },
            invalidatesTags: ["CooperationType", "CooperationTypes"],
        }),
        archiveCooperationType: build.mutation<
            CooperationTypeT,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/cooperation_type/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["CooperationType", "CooperationTypes"],
        }),
        restoreCooperationType: build.mutation<
            CooperationTypeT,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/cooperation_type/${id}/restore`,
                method: "PUT",
            }),
            invalidatesTags: ["CooperationType", "CooperationTypes"],
        }),
        // useful link
        listUsefulLink: build.query<
            ApiResponse<ListResponseT<UsefulLinkT>>,
            ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/useful_link/list`,
                method: "GET",
                params,
            }),
            providesTags: ["UsefulLinks"],
        }),
        createUsefulLink: build.mutation<
            ApiResponse<{ id: number }>,
            NewUsefulLinkT
        >({
            query: (body) => ({
                url: `${apiVersion}/useful_link`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["UsefulLinks"],
        }),
        updateUsefulLink: build.mutation<
            ApiResponse<{ id: number }>,
            UpdateUsefulLinkT
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/useful_link/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["UsefulLinks"],
        }),
        deleteUsefulLink: build.mutation<ApiResponse<{ id: number }>, number>({
            query: (id) => ({
                url: `${apiVersion}/useful_link/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["UsefulLinks"],
        }),
        // api-token
        listAPIToken: build.query<
            ApiResponse<ListResponseT<APITokenT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/settings/api-token/list`,
                method: "GET",
                params,
            }),
            providesTags: ["APITokens"],
        }),
        createAPIToken: build.mutation<
            ApiResponse<CreatedAPITokenT>,
            NewAPITokenT
        >({
            query: (body) => ({
                url: `${apiVersion}/settings/api-token`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["APITokens"],
        }),
        deleteAPIToken: build.mutation<ApiResponse<{ id: number }>, number>({
            query: (id) => ({
                url: `${apiVersion}/settings/api-token/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["APITokens"],
        }),
        // employee pool
        listEmployeePoolSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/catalog/employee-pool/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
            providesTags: ["EmployeePools"],
        }),
        listEmployeePool: build.query<
            ApiResponse<ListResponseT<EmployeePoolT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/catalog/employee-pool/list`,
                params,
            }),
            providesTags: ["EmployeePools"],
        }),
        getEmployeePool: build.query<ApiResponse<EmployeePoolT>, number>({
            query: (id) => ({
                url: `${apiVersion}/catalog/employee-pool/${id}`,
            }),
            providesTags: ["EmployeePool"],
        }),
        createEmployeePool: build.mutation<
            ApiResponse<{ id: number }>,
            NewEmployeePoolT
        >({
            query: (body) => ({
                url: `${apiVersion}/catalog/employee-pool`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["EmployeePools"],
        }),
        updateEmployeePool: build.mutation<
            ApiResponse<{ id: number }>,
            UpdateEmployeePoolT
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/catalog/employee-pool/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["EmployeePool", "EmployeePools"],
        }),
        // team tags
        listTeamTagSelect: build.query<Array<SelectTagOptionT>, string>({
            query: (search) => ({
                url: `${apiVersion}/catalog/team-tag/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<Array<SelectTagOptionT>>) =>
                result.payload,
            providesTags: ["TeamTags"],
        }),
        listTeamTag: build.query<
            ApiResponse<ListResponseT<TeamTagT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/catalog/team-tag/list`,
                params,
            }),
            providesTags: ["TeamTags"],
        }),
        getTeamTag: build.query<ApiResponse<TeamTagT>, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/team-tag/${id}`,
            }),
            providesTags: ["TeamTag"],
        }),
        createTeamTag: build.mutation<ApiResponse<{ id: number }>, NewTeamTagT>(
            {
                query: (body) => ({
                    url: `${apiVersion}/catalog/team-tag`,
                    method: "POST",
                    body,
                }),
                invalidatesTags: ["TeamTags"],
            },
        ),
        updateTeamTag: build.mutation<
            ApiResponse<{ id: number }>,
            UpdateTeamTagT
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/catalog/team-tag/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["TeamTag", "TeamTags"],
        }),
        archiveTeamTag: build.mutation<TeamTagT, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/team-tag/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["TeamTag", "TeamTags"],
        }),
        restoreTeamTag: build.mutation<TeamTagT, { id: number }>({
            query: ({ id }) => ({
                url: `${apiVersion}/catalog/team-tag/${id}/restore`,
                method: "PUT",
            }),
            invalidatesTags: ["TeamTag", "TeamTags"],
        }),
    }),
});
