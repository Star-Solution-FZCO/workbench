import { createApi } from "@reduxjs/toolkit/query/react";
import { apiVersion } from "config";
import {
    AdminImportT,
    ApiResponse,
    ChangelogT,
    CustomBaseQueryFn,
    ListRequestParamsT,
    ListResponseT,
    NewChangelogT,
    NewNotificationT,
    NotificationT,
    OTPStatusT,
    OTPTokenT,
    PasswordSetT,
    SelectOptionT,
    UpdateChangelogT,
    UpdateNotificationT,
} from "types";
import customFetchBase from "./custom_fetch_base";

const tagTypes = [
    "Timezones",
    "Notification",
    "Notifications",
    "Changelog",
    "Changelogs",
    "OTP",
];

export const sharedApi = createApi({
    reducerPath: "sharedApi",
    baseQuery: customFetchBase as CustomBaseQueryFn,
    tagTypes,
    endpoints: (build) => ({
        // TM
        setTMKey: build.mutation<ApiResponse<{ tm_key: string }>, number>({
            query: (id) => ({
                url: `${apiVersion}/employee/${id}/tm_key`,
                method: "PUT",
            }),
        }),
        // timezone
        listTimezoneSelect: build.query<SelectOptionT[], string>({
            query: (search) => ({
                url: `${apiVersion}/select/timezone`,
                ...(search ? { params: { search } } : {}),
            }),
            transformResponse: (result: ApiResponse<SelectOptionT[]>) =>
                result.payload,
            providesTags: ["Timezones"],
        }),
        // notifications
        listNotification: build.query<
            ApiResponse<ListResponseT<NotificationT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/notifications`,
                method: "GET",
                params,
            }),
            providesTags: ["Notifications"],
        }),
        listEmployeeNotification: build.query<
            ApiResponse<ListResponseT<NotificationT>>,
            ListRequestParamsT
        >({
            query: (params) => ({
                url: `${apiVersion}/notifications/list/my`,
                method: "GET",
                params,
            }),
            providesTags: ["Notifications"],
        }),
        getNotification: build.mutation<ApiResponse<NotificationT>, number>({
            query: (id) => ({
                url: `${apiVersion}/notifications/${id}`,
            }),
            invalidatesTags: ["Notification"],
        }),
        createNotifications: build.mutation<
            ApiResponse<string>,
            NewNotificationT
        >({
            query: (body) => ({
                url: `${apiVersion}/notifications`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Notifications"],
        }),
        updateNotification: build.mutation<
            ApiResponse<{ id: number }>,
            UpdateNotificationT
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/notifications/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Notification", "Notifications"],
        }),
        markNotificationsAsRead: build.mutation<ApiResponse<string>, number[]>({
            query: (notifications) => ({
                url: `${apiVersion}/notifications/read`,
                method: "POST",
                body: { notifications },
            }),
        }),
        deleteNotification: build.mutation<ApiResponse<{ id: number }>, number>(
            {
                query: (id) => ({
                    url: `${apiVersion}/notifications/${id}`,
                    method: "DELETE",
                }),
                invalidatesTags: ["Notifications"],
            },
        ),
        // import
        startAdminImport: build.mutation<ApiResponse<AdminImportT>, FormData>({
            query: (body) => ({
                url: `${apiVersion}/admin/import`,
                method: "POST",
                body,
            }),
        }),
        approveAdminImport: build.mutation<ApiResponse<object>, { id: string }>(
            {
                query: ({ id }) => ({
                    url: `${apiVersion}/admin/import/${id}/approve`,
                    method: "PUT",
                }),
            },
        ),
        // changelogs
        listChangelog: build.query<
            ApiResponse<ListResponseT<ChangelogT>>,
            ListRequestParamsT
        >({
            query: ({ ...params }) => ({
                url: `${apiVersion}/changelog/list`,
                method: "GET",
                params,
            }),
            providesTags: ["Changelogs"],
        }),
        listChangelogName: build.query<
            Array<{ id: number; name: string }>,
            void
        >({
            query: () => ({
                url: `${apiVersion}/changelog/list/name`,
                method: "GET",
            }),
            providesTags: ["Changelogs"],
        }),
        getChangelog: build.query<ApiResponse<ChangelogT>, number>({
            query: (id) => ({
                url: `${apiVersion}/changelog/${id}`,
                method: "GET",
            }),
            providesTags: ["Changelog"],
        }),
        createChangelog: build.mutation<
            ApiResponse<{ id: number }>,
            NewChangelogT
        >({
            query: (body) => ({
                url: `${apiVersion}/changelog`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Changelogs"],
        }),
        updateChangelog: build.mutation<
            ApiResponse<{ id: number }>,
            UpdateChangelogT
        >({
            query: ({ id, ...body }) => ({
                url: `${apiVersion}/changelog/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Changelog", "Changelogs"],
        }),
        deleteChangelog: build.mutation<ApiResponse<{ id: number }>, number>({
            query: (id) => ({
                url: `${apiVersion}/changelog/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Changelogs"],
        }),
        // otp
        getOTPStatus: build.query<OTPStatusT, void>({
            query: () => ({
                url: `${apiVersion}/settings/otp`,
                method: "GET",
            }),
            transformResponse: (result: ApiResponse<OTPStatusT>) =>
                result.payload,
            providesTags: ["OTP"],
        }),
        createOTP: build.mutation<ApiResponse<OTPTokenT>, void>({
            query: () => ({
                url: `${apiVersion}/settings/otp`,
                method: "POST",
            }),
            invalidatesTags: ["OTP"],
        }),
        deleteOTP: build.mutation<ApiResponse<never>, void>({
            query: () => ({
                url: `${apiVersion}/settings/otp`,
                method: "DELETE",
            }),
            invalidatesTags: ["OTP"],
        }),
        // file upload
        uploadAttachment: build.mutation<
            ApiResponse<{ url: string }>,
            FormData
        >({
            query: (body) => ({
                url: `${apiVersion}/upload/attachment`,
                method: "POST",
                body,
                formData: true,
            }),
        }),
        setPassword: build.mutation<ApiResponse<null>, PasswordSetT>({
            query: (body) => ({
                url: `${apiVersion}/settings/password`,
                method: "POST",
                body,
            }),
        }),
    }),
});
