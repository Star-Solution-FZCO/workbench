import { createApi } from "@reduxjs/toolkit/query/react";
import { apiVersion } from "config";
import {
    ApiResponse,
    ArticlesResponseT,
    CustomBaseQueryFn,
    HelpCenterRequestDetailT,
    ListHelpCenterRequestParamsT,
    ListRequestParamsT,
    ListResponseT,
    NewHelpCenterRequestT,
    NewPortalGroupT,
    NewPortalT,
    NewServiceT,
    PortalGroupT,
    PortalT,
    SelectOptionT,
    ServiceT,
    UpdatePortalGroupT,
    UpdatePortalT,
    UpdateServiceT,
    YTIssueT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = ["HelpCenterIcons", "HelpCenterRequest", "HelpCenterRequests"];

export const helpCenterApi = createApi({
    reducerPath: "helpCenterApi",
    baseQuery: customFetchBase as CustomBaseQueryFn,
    tagTypes,
    endpoints: (build) => ({
        listPortals: build.query<
            ApiResponse<ListResponseT<PortalT>>,
            ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/help-center/portal/list`,
                method: "GET",
                params,
            }),
            providesTags: ["Portals"],
        }),
        listPortalSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/help-center/portal/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
            providesTags: ["Portals"],
        }),
        getPortal: build.query<ApiResponse<PortalT>, number>({
            query: (id) => ({
                url: `${apiVersion}/help-center/portal/${id}`,
                method: "GET",
            }),
            providesTags: ["Portal"],
        }),
        createPortal: build.mutation<ApiResponse<{ id: number }>, NewPortalT>({
            query: (body) => ({
                url: `${apiVersion}/help-center/portal`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Portals"],
        }),
        updatePortal: build.mutation<
            ApiResponse<{ id: number }>,
            UpdatePortalT
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/help-center/portal/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Portal", "Portals"],
        }),
        deletePortal: build.mutation<ApiResponse<{ id: number }>, number>({
            query: (id) => ({
                url: `${apiVersion}/help-center/portal/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Portals"],
        }),
        listPortalGroups: build.query<
            ApiResponse<ListResponseT<PortalGroupT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/help-center/portal/group/list`,
                method: "GET",
                params,
            }),
            providesTags: ["PortalGroups"],
        }),
        listPortalGroupSelect: build.query<
            SelectOptionT[],
            { portal_id: number; search: string }
        >({
            query: ({ portal_id, search }) => ({
                url: `${apiVersion}/help-center/portal/${portal_id}/group/select`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
            providesTags: ["PortalGroups"],
        }),
        getPortalGroup: build.query<ApiResponse<PortalGroupT>, number>({
            query: (id) => ({
                url: `${apiVersion}/help-center/portal/group/${id}`,
                method: "GET",
            }),
            providesTags: ["PortalGroup"],
        }),
        createPortalGroup: build.mutation<
            ApiResponse<{ id: number }>,
            NewPortalGroupT
        >({
            query: (body) => ({
                url: `${apiVersion}/help-center/portal/group`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["PortalGroups"],
        }),
        updatePortalGroup: build.mutation<
            ApiResponse<{ id: number }>,
            UpdatePortalGroupT
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/help-center/portal/group/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["PortalGroup", "PortalGroups"],
        }),
        deletePortalGroup: build.mutation<ApiResponse<{ id: number }>, number>({
            query: (id) => ({
                url: `${apiVersion}/help-center/portal/group/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["PortalGroups"],
        }),
        searchArticles: build.query<
            ApiResponse<ArticlesResponseT>,
            { query: string; start: number; limit: number; portal_id?: number }
        >({
            query: (params) => ({
                url: `${apiVersion}/help-center/search`,
                params,
            }),
        }),
        listService: build.query<
            ApiResponse<ListResponseT<ServiceT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/help-center/service/list`,
                method: "GET",
                params,
            }),
            providesTags: ["Services"],
        }),
        listHelpCenterServiceSelect: build.query<SelectOptionT[], void>({
            query: () => ({
                url: `${apiVersion}/help-center/service/select`,
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
            providesTags: ["Services"],
        }),
        getService: build.query<ApiResponse<ServiceT>, number>({
            query: (id) => ({
                url: `${apiVersion}/help-center/service/${id}`,
                method: "GET",
            }),
            providesTags: ["Service"],
        }),
        createService: build.mutation<ApiResponse<{ id: number }>, NewServiceT>(
            {
                query: (body) => ({
                    url: `${apiVersion}/help-center/service`,
                    method: "POST",
                    body,
                }),
                invalidatesTags: ["Services"],
            },
        ),
        updateService: build.mutation<
            ApiResponse<{ id: number }>,
            UpdateServiceT
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/help-center/service/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Service", "Services"],
        }),
        deleteService: build.mutation<ApiResponse<{ id: number }>, number>({
            query: (id) => ({
                url: `${apiVersion}/help-center/service/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Services"],
        }),
        listHelpCenterRequest: build.query<
            ApiResponse<ListResponseT<YTIssueT>>,
            ListHelpCenterRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/help-center/request/list`,
                method: "GET",
                params,
            }),
            providesTags: ["HelpCenterRequests"],
        }),
        listHelpCenterIcon: build.query<
            Array<{ id: number; created: string; url: string; type: string }>,
            void
        >({
            query: () => ({
                url: `${apiVersion}/help-center/attachments/list`,
                method: "GET",
            }),
            transformResponse: (
                result: ApiResponse<
                    Array<{
                        id: number;
                        created: string;
                        url: string;
                        type: string;
                    }>
                >,
            ) => result.payload,
            providesTags: ["HelpCenterIcons"],
        }),
        deleteHelpCenterIcon: build.mutation<
            ApiResponse<{ id: number }>,
            number
        >({
            query: (id) => ({
                url: `${apiVersion}/help-center/attachments/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["HelpCenterIcons"],
        }),
        getHelpCenterRequest: build.query<
            ApiResponse<HelpCenterRequestDetailT>,
            string
        >({
            query: (id) => ({
                url: `${apiVersion}/help-center/request/${id}`,
                method: "GET",
            }),
            providesTags: ["HelpCenterRequest"],
        }),
        createHelpCenterRequest: build.mutation<
            ApiResponse<{ id: string; idReadable: string; $type: string }>,
            NewHelpCenterRequestT
        >({
            query: (body) => ({
                url: `${apiVersion}/help-center/request`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["HelpCenterRequests"],
        }),
        updateHelpCenterRequest: build.mutation<
            ApiResponse<{ id: number }>,
            any
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/help-center/request/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["HelpCenterRequest", "HelpCenterRequests"],
        }),
        resolveHelpCenterRequest: build.mutation<
            ApiResponse<{ id: string; idReadable: string; $type: string }>,
            string
        >({
            query: (id) => ({
                url: `${apiVersion}/help-center/request/${id}/resolve`,
                method: "POST",
            }),
            invalidatesTags: ["HelpCenterRequest", "HelpCenterRequests"],
        }),
        createHelpCenterRequestComment: build.mutation<
            ApiResponse<{ id: string; $type: string }>,
            { issueId: string; text: string }
        >({
            query: ({ issueId: issue_id, ...body }) => ({
                url: `${apiVersion}/help-center/request/${issue_id}/comment`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["HelpCenterRequest"],
        }),
        updateHelpCenterRequestComment: build.mutation<
            ApiResponse<{ id: string; $type: string }>,
            { issueId: string; commentId: string; text: string }
        >({
            query: ({ issueId, commentId, ...body }) => ({
                url: `${apiVersion}/help-center/request/${issueId}/comment/${commentId}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["HelpCenterRequest"],
        }),
        deleteHelpCenterRequestComment: build.mutation<
            ApiResponse<{ id: string; $type: string }>,
            { issueId: string; commentId: string }
        >({
            query: ({ issueId, commentId }) => ({
                url: `${apiVersion}/help-center/request/${issueId}/comment/${commentId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["HelpCenterRequest"],
        }),
        uploadHelpCenterRequestAttachments: build.mutation<
            ApiResponse<{ id: string }>,
            { issueId: string; body: FormData }
        >({
            query: ({ issueId, body }) => ({
                url: `${apiVersion}/help-center/request/${issueId}/attachments`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["HelpCenterRequest"],
        }),
        deleteHelpCenterRequestAttachment: build.mutation<
            ApiResponse<{ id: string }>,
            { issueId: string; attachmentId: string }
        >({
            query: ({ issueId, attachmentId }) => ({
                url: `${apiVersion}/help-center/request/${issueId}/attachments/${attachmentId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["HelpCenterRequest"],
        }),
        uploadHelpCenterRequestCommentAttachments: build.mutation<
            ApiResponse<{ id: string }>,
            { issueId: string; commentId: string; body: FormData }
        >({
            query: ({ issueId, commentId, body }) => ({
                url: `${apiVersion}/help-center/request/${issueId}/comment/${commentId}/attachments`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["HelpCenterRequest"],
        }),
        listConfluenceSpaceKeysSelect: build.query<
            SelectOptionT[],
            { start: number; limit: number }
        >({
            query: (params) => ({
                url: `${apiVersion}/help-center/confluence/space/select`,
                params,
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
        }),
        listYoutrackProjectSelect: build.query<SelectOptionT[], void>({
            query: () => ({
                url: `${apiVersion}/help-center/youtrack/project/select`,
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
        }),
        getYoutrackProjectFields: build.query<ApiResponse<any>, string>({
            query: (projectId) => ({
                url: `${apiVersion}/help-center/youtrack/project/${projectId}/fields`,
            }),
        }),
        createHelpCenterAttachment: build.mutation<
            ApiResponse<{ id: number }>,
            { url: string; type: string }
        >({
            query: (body) => ({
                url: `${apiVersion}/help-center/attachments`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["HelpCenterIcons"],
        }),
    }),
});
