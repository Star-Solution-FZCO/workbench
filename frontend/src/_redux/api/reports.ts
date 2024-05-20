import { createApi } from "@reduxjs/toolkit/query/react";
import { apiVersion } from "config";
import {
    ActivityDetailsT,
    ActivitySourceT,
    ActivitySummaryT,
    ActivitySummaryTotalT,
    ApiResponse,
    CustomBaseQueryFn,
    DayOffDetailsReportItemT,
    DayOffSummaryReportItemT,
    DoneTasksSummaryT,
    DoneTasksSummaryTotalT,
    DueDateReportItemT,
    EmployeeActivitySourceAliasT,
    EmployeeActivityT,
    IGroup,
    INewGroup,
    IUpdateGroup,
    IssuesSettingsT,
    ListRequestParamsT,
    ListResponseT,
    NewActivitySourceT,
    PresenceDetailsT,
    PresenceSummaryT,
    SelectOptionT,
    TMEmployeeSetStatusT,
    TMEmployeeStatusT,
    TeamMemberReportItemT,
    VacationReportT,
} from "types";
import { saveFile } from "utils";
import customFetchBase from "./custom_fetch_base";

const tagTypes = [
    "Activities",
    "ActivitySources",
    "Group",
    "Groups",
    "PresenceDetails",
    "ReportTypes",
    "TMStatus",
    "IssuesSettings",
];

export const reportsApi = createApi({
    reducerPath: "reportsApi",
    baseQuery: customFetchBase as CustomBaseQueryFn,
    tagTypes,
    endpoints: (build) => ({
        // TM
        getTMStatus: build.query<
            ApiResponse<TMEmployeeStatusT>,
            { employee_id: number }
        >({
            query: ({ employee_id }) => ({
                url: `${apiVersion}/tm/status/${employee_id}`,
                method: "GET",
            }),
            providesTags: ["TMStatus"],
        }),
        setTMStatus: build.mutation<string, TMEmployeeSetStatusT>({
            query: (body) => ({
                url: `${apiVersion}/tm/status`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["TMStatus", "PresenceDetails"],
        }),
        // reports
        listEmployeeReportTypeSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/report/employee/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
            providesTags: ["ReportTypes"],
        }),
        getActivitySummaryReport: build.query<
            ApiResponse<ListResponseT<ActivitySummaryT>>,
            { start: string; end: string } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/activity-summary-report`,
                method: "GET",
                params,
            }),
        }),
        getActivitySummaryReportCSV: build.query<unknown, ListRequestParamsT>({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/activity-summary-report/csv`,
                method: "GET",
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(blob, "activity-summary-report.csv");
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
        getActivityDetailsReport: build.query<
            ApiResponse<ListResponseT<ActivityDetailsT>>,
            {
                start: string;
                end: string;
                activity_filter?: any;
            } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/activity-details-report`,
                method: "GET",
                params,
            }),
        }),
        getActivityDetailsReportCSV: build.query<
            unknown,
            {
                start: string;
                end: string;
                activity_filter?: any;
            } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/activity-details-report/csv`,
                method: "GET",
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(blob, "activity-details-report.csv");
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
        getActivitySummaryTotalReport: build.query<
            ApiResponse<ListResponseT<ActivitySummaryTotalT>>,
            { start: string; end: string } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/activity-summary-total-report`,
                method: "GET",
                params,
            }),
        }),
        getActivitySummaryTotalReportCSV: build.query<
            unknown,
            ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/activity-summary-total-report/csv`,
                method: "GET",
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(
                                blob,
                                "activity-summary-total-report.csv",
                            );
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
        getDoneTasksSummaryReport: build.query<
            ApiResponse<ListResponseT<DoneTasksSummaryT>>,
            { start: string; end: string } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/done-tasks-summary-report`,
                method: "GET",
                params,
            }),
        }),
        getDoneTasksSummaryReportCSV: build.query<unknown, ListRequestParamsT>({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/done-tasks-summary-report/csv`,
                method: "GET",
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(
                                blob,
                                "done-tasks-summary-report.csv",
                            );
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
        getDoneTasksSummaryTotalReport: build.query<
            ApiResponse<ListResponseT<DoneTasksSummaryTotalT>>,
            { start: string; end: string } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/done-tasks-summary-total-report`,
                method: "GET",
                params,
            }),
        }),
        getDoneTasksSummaryTotalReportCSV: build.query<
            unknown,
            ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/done-tasks-summary-total-report/csv`,
                method: "GET",
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(
                                blob,
                                "done-tasks-summary-total-report.csv",
                            );
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
        getVacationFreeDaysReport: build.query<
            ApiResponse<ListResponseT<VacationReportT>>,
            ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/vacation-free-days-report`,
                method: "GET",
                params,
            }),
        }),
        getVacationFreeDaysReportCSV: build.query<unknown, ListRequestParamsT>({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/vacation-free-days-report/csv`,
                method: "GET",
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(
                                blob,
                                "vacation-free-days-report.csv",
                            );
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
        getWorkingTimeMonthReport: build.query<unknown, ListRequestParamsT>({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/working-time-month-report`,
                method: "GET",
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(
                                blob,
                                "working-time-month-report.xlsx",
                            );
                        });
                        return {};
                    }
                    return {
                        error: {
                            status: response.status,
                            message: response.statusText,
                        },
                    };
                },
                cache: "no-cache",
                params,
            }),
        }),
        listEmployeeActivity: build.query<
            ApiResponse<ListResponseT<EmployeeActivityT>>,
            { id: number } & ListRequestParamsT
        >({
            query: ({ id, ...params }) => ({
                url: `${apiVersion}/employee/${id}/activity/list`,
                method: "GET",
                params,
            }),
            providesTags: ["Activities"],
        }),
        listSourceSelect: build.query<
            ApiResponse<Array<SelectOptionT>>,
            { search?: string }
        >({
            query: (params) => ({
                url: `${apiVersion}/activity/source/select`,
                method: "GET",
                params,
            }),
        }),
        listActivitySourceTypeSelect: build.query<
            ApiResponse<SelectOptionT[]>,
            { search?: string }
        >({
            query: (params) => ({
                url: `${apiVersion}/activity/source/select/type`,
                method: "GET",
                params,
            }),
        }),
        createActivitySource: build.mutation<
            ApiResponse<{ id: number }>,
            NewActivitySourceT
        >({
            query: (body) => ({
                url: `${apiVersion}/activity/source`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["ActivitySources"],
        }),
        listActivitySource: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/activity/source/list`,
                method: "GET",
                ...(search && { params: { search } }),
            }),
            transformResponse: (
                result: ApiResponse<ListResponseT<ActivitySourceT>>,
            ) => {
                return result.payload.items.map((item) => ({
                    value: item.id,
                    label: item.name,
                }));
            },
            providesTags: ["ActivitySources"],
        }),
        listEmployeeActivitySourceAlias: build.query<
            ApiResponse<ListResponseT<EmployeeActivitySourceAliasT>>,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `${apiVersion}/employee/${id}/activity/alias/list`,
                method: "GET",
            }),
            providesTags: ["ActivitySources"],
        }),
        getPresenceSummaryReport: build.query<
            ApiResponse<ListResponseT<PresenceSummaryT>>,
            { start: string; end: string } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/presence-summary-report`,
                method: "GET",
                params,
            }),
            providesTags: ["PresenceDetails"],
        }),
        getPresenceSummaryReportCSV: build.query<
            unknown,
            { start: string; end: string } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/presence-summary-report/csv`,
                method: "GET",
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(blob, "presence-summary-report.csv");
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
        getPresenceDetailsReport: build.query<
            ApiResponse<ListResponseT<PresenceDetailsT>>,
            { start: string; end: string } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/presence`,
                method: "GET",
                params,
            }),
            providesTags: ["PresenceDetails"],
        }),
        getPresenceDetailsReportCSV: build.query<
            unknown,
            { start: string; end: string } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/presence/csv`,
                method: "GET",
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(blob, "presence-details-report.csv");
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
        getDayOffSummaryReport: build.query<
            ApiResponse<ListResponseT<DayOffSummaryReportItemT>>,
            { start: string; end: string } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/day-off-summary-report`,
                method: "GET",
                params,
            }),
        }),
        getDayOffSummaryReportCSV: build.query<
            unknown,
            { start: string; end: string } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/day-off-summary-report/csv`,
                method: "GET",
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(blob, "day-off-summary-report.csv");
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
        getDayOffDetailsReport: build.query<
            ApiResponse<ListResponseT<DayOffDetailsReportItemT>>,
            { start: string; end: string } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/day-off-details-report`,
                method: "GET",
                params,
            }),
        }),
        getDayOffDetailsReportCSV: build.query<
            unknown,
            { start: string; end: string } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/day-off-details-report/csv`,
                method: "GET",
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(blob, "day-off-details-report.csv");
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
        listTeamReportTypeSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/report/team/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
        }),
        getTeamMembersReport: build.query<
            ApiResponse<ListResponseT<TeamMemberReportItemT>>,
            { start: string; end: string } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/team/members-report`,
                method: "GET",
                params,
            }),
        }),
        getTeamMembersReportCSV: build.query<
            unknown,
            {
                start: string;
                end: string;
            } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/team/members-report/csv`,
                method: "GET",
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(blob, "members-report.csv");
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
        getDueDateReport: build.query<
            ApiResponse<ListResponseT<DueDateReportItemT>>,
            {
                start: string;
                end: string;
            } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/due-date-report`,
                method: "GET",
                params,
            }),
        }),
        getDueDateReportCSV: build.query<
            unknown,
            {
                start: string;
                end: string;
            } & ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/report/employee/due-date-report/csv`,
                method: "GET",
                responseHandler: async (response) => {
                    if (response.ok) {
                        response.blob().then(async (blob) => {
                            await saveFile(blob, "due-date-report.csv");
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
        // groups
        listGroup: build.query<
            ApiResponse<
                ListResponseT<{
                    id: number;
                    name: string;
                    editable: boolean;
                    public: boolean;
                }>
            >,
            ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/group/list`,
                method: "GET",
                params,
            }),
            providesTags: ["Groups"],
        }),
        listGroupSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/group/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
            providesTags: ["Groups"],
        }),
        getGroup: build.query<ApiResponse<IGroup>, number>({
            query: (id) => ({
                url: `${apiVersion}/group/${id}`,
                method: "GET",
            }),
            providesTags: ["Group"],
        }),
        createGroup: build.mutation<ApiResponse<{ id: number }>, INewGroup>({
            query: (body) => ({
                url: `${apiVersion}/group`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Groups"],
        }),
        updateGroup: build.mutation<ApiResponse<{ id: number }>, IUpdateGroup>({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/group/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Group", "Groups"],
        }),
        deleteGroup: build.mutation<ApiResponse<{ id: number }>, number>({
            query: (id) => ({
                url: `${apiVersion}/group/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Groups"],
        }),
        // issues settings
        getIssuesSettings: build.query<ApiResponse<IssuesSettingsT>, void>({
            query: () => ({
                url: `${apiVersion}/report/employee/issues-settings`,
            }),
            providesTags: ["IssuesSettings"],
        }),
        updateIssuesSettings: build.mutation<
            ApiResponse<IssuesSettingsT>,
            { projects: string[] }
        >({
            query: (body) => {
                return {
                    url: `${apiVersion}/report/employee/issues-settings`,
                    method: "PUT",
                    body,
                };
            },
            invalidatesTags: ["IssuesSettings"],
        }),
    }),
});
