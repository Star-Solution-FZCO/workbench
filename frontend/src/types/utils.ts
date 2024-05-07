import { BaseQueryFn, FetchArgs } from "@reduxjs/toolkit/query";
import {
    activityReportColumns,
    contactTypes,
    dayTypes,
    daysOfWeek,
    reportTypes,
} from "config";
import { QueryErrorT, QueryStringErrorT } from "./api";

export type SelectOptionT = {
    readonly value: number | string;
    readonly label: string;
    readonly isDisabled?: boolean;
};

export type CustomBaseQueryFn = BaseQueryFn<
    string | FetchArgs,
    unknown,
    QueryErrorT | QueryStringErrorT,
    unknown
>;

export type DayT = (typeof dayTypes)[number];

export type DayOfWeekT = (typeof daysOfWeek)[number];

export type ReportTypeT = (typeof reportTypes)[number];

export type ActivityReportColumnT = (typeof activityReportColumns)[number];

export type TableWidthModeT = "fitContent" | "fullWidth";

export type StateFilterT = "all" | "active" | "disabled";

export type CounterAgentStatusFilterT =
    | "all"
    | "valid"
    | "suspended"
    | "invalid";

export type ContactTypeT = (typeof contactTypes)[number];
