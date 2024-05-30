import { ActivityReportColumnT, DayT } from "types";

export const SITE_NAME = "Workbench";

export const apiVersion = "v1";

const appConstants = {
    sideBarSize: 200,
    profileKeyName: "profile",
};

export const loginPageUrl = "/login";

export const perPageLoad = 50;

export const fileMaxSize = 3 * 1024 * 1024; // 3 MB

export const defaultErrorMessage = "An error has occurred. Contact support";

export const dayTypes = [
    "working_day",
    "weekend",
    "holiday",
    "sick_day",
    "working_day_personal_schedule",
    "weekend_personal_schedule",
    "vacation",
    "unpaid_leave",
    "business_trip",
    "day_before_employment",
    "day_after_dismissal",
] as const;

export const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
] as const;

export const dayBackgroundStyleMap: Record<DayT, string> = {
    working_day: "#ffffff",
    weekend: "#ffa3a6",
    holiday: "#e3242c",
    sick_day: "#2A9134",
    working_day_personal_schedule: "#00B3AD",
    weekend_personal_schedule: "#B33F00",
    vacation: "#1E91D6",
    unpaid_leave: "#3D52D5",
    business_trip: "#FFB627",
    day_before_employment: "#adb5bd",
    day_after_dismissal: "#adb5bd",
};

export const reportTypes = [
    "activity-details-report",
    "activity-summary-report",
    "activity-summary-total-report",
    "presence",
    "presence-summary-report",
    "vacation-free-days-report",
    "day-off-summary-report",
    "day-off-details-report",
    "calendar-report",
    "due-date-report",
    "done-tasks-summary-report",
    "done-tasks-summary-total-report",
] as const;

export const activityReportColumns = [
    "youtrack",
    "gerrit_merged",
    "gerrit_new",
    "gerrit_reviewed",
    "gerrit_comments",
    "cvs",
    "google_meet",
    "discord_call",
    "pararam",
    "google_drive",
    "zendesk",
] as const;

export const activityReportColumnMap: {
    key: ActivityReportColumnT;
    label: string;
}[] = [
    { key: "youtrack", label: "Youtrack" },
    { key: "gerrit_merged", label: "Gerrit merged" },
    { key: "gerrit_new", label: "Gerrit new changes" },
    { key: "gerrit_reviewed", label: "Gerrit reviewed" },
    { key: "gerrit_comments", label: "Gerrit comments" },
    { key: "cvs", label: "CVS" },
    { key: "google_meet", label: "Google meet calls" },
    { key: "discord_call", label: "Discord calls" },
    { key: "pararam", label: "Pararam posts" },
    { key: "google_drive", label: "Google drive" },
    { key: "zendesk", label: "Zendesk" },
];

export const onboardingFields = [
    "description",
    "end",
    "start",
    "summary",
    "youtrack_issue_id",
    "google_calendar_event_id",
    "google_calendar_event_link",
    "contacts",
    "work_mode",
    "comment",
    "organization",
];

export const monthCount = 12;
export const currentMonth = new Date().getMonth();
export const currentYear = new Date().getFullYear();
export const pararamChatURL = "https://app.pararam.io/#/threads/new-pm/";

export const today = () => new Date();
export const todayUTC = () => new Date().toISOString().split("T")[0];
export const weekAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
};
export const monthAgo = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
};

export const API_BASE_URL =
    (window as any)?.env?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL;
export const STORAGE_URL =
    (window as any)?.env?.STORAGE_URL || import.meta.env.VITE_STORAGE_URL;
export const SENTRY_DSN =
    (window as any)?.env?.SENTRY_DSN || import.meta.env.VITE_SENTRY_DSN;
export const MUI_X_LICENSE_KEY =
    (window as any)?.env?.MUI_X_LICENSE_KEY ||
    import.meta.env.VITE_MUI_X_LICENSE_KEY;
export const APP_VERSION =
    (window as any)?.env?.APP_VERSION ||
    import.meta.env.VITE_APP_VERSION ||
    "__DEV__";
export const WIKI_URL =
    (window as any)?.env?.WIKI_URL || import.meta.env.VITE_WIKI_URL;
export const YOUTRACK_URL =
    (window as any)?.env?.YOUTRACK_URL || import.meta.env.VITE_YOUTRACK_URL;
export const DEFAULT_EMAIL_DOMAIN =
    (window as any)?.env?.DEFAULT_EMAIL_DOMAIN ||
    import.meta.env.VITE_DEFAULT_EMAIL_DOMAIN ||
    "example.com";
export const OFFBOARD_CHECKLIST_URL =
    (window as any)?.env?.OFFBOARD_CHECKLIST_URL ||
    import.meta.env.VITE_OFFBOARD_CHECKLIST_URL;
export const CREDENTIALS_SERVICE_URL =
    (window as any)?.env?.CREDENTIALS_SERVICE_URL ||
    import.meta.env.VITE_CREDENTIALS_SERVICE_URL;
export const AUTH_MODE =
    (window as any)?.env?.AUTH_MODE || import.meta.env.VITE_AUTH_MODE || "ldap";

export const excludedStorageKeysFromClear = [
    "doesNotShowNewReleaseDialogAgain",
    "OnboardingCompletedEarlier",
    "activityReportColumns",
    "tableWidthMode",
];

export const contactTypes = [
    "phone",
    "email",
    "pararam",
    "telegram",
    "whatsapp",
    "other",
] as const;

export default appConstants;
