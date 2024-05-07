import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ActivityReportColumnT, TableWidthModeT } from "types";

const initialActivityReportColumns: Record<ActivityReportColumnT, boolean> = {
    youtrack: true,
    gerrit_merged: true,
    gerrit_new: true,
    gerrit_reviewed: true,
    gerrit_comments: true,
    cvs: true,
    google_meet: true,
    discord_call: true,
    pararam: true,
    google_drive: true,
    zendesk: true,
};

const rawPersistedActivityReportColumns = localStorage.getItem(
    "activityReportColumns",
);

const persistedActivityReportColumns = rawPersistedActivityReportColumns
    ? JSON.parse(rawPersistedActivityReportColumns)
    : null;

interface ISharedState {
    displayingCalendarMonths: number;
    activityReportColumns: Record<ActivityReportColumnT, boolean>;
    tableWidthMode: TableWidthModeT;
    quizStatus: {
        fetching: boolean;
        success: boolean;
    };
}

const initialState: ISharedState = {
    displayingCalendarMonths: 4,
    activityReportColumns:
        persistedActivityReportColumns || initialActivityReportColumns,
    tableWidthMode:
        (localStorage.getItem("tableWidthMode") as TableWidthModeT) ||
        "fitContent",
    quizStatus: {
        fetching: false,
        success: true,
    },
};

const sharedSlice = createSlice({
    name: "shared",
    initialState,
    reducers: {
        setDisplayingCalendarMonths: (state, action: PayloadAction<number>) => {
            state.displayingCalendarMonths = action.payload;
        },
        setActivityReportColumns: (
            state,
            action: PayloadAction<Record<ActivityReportColumnT, boolean>>,
        ) => {
            state.activityReportColumns = action.payload;
            const serializedActivityReportColumns = JSON.stringify(
                action.payload,
            );
            localStorage.setItem(
                "activityReportColumns",
                serializedActivityReportColumns,
            );
        },
        changeTableWidthMode: (state) => {
            const newMode =
                state.tableWidthMode === "fitContent"
                    ? "fullWidth"
                    : "fitContent";
            state.tableWidthMode = newMode;
            localStorage.setItem("tableWidthMode", newMode);
        },
        setQuizStatus: (
            state,
            action: PayloadAction<
                Partial<{
                    fetching: boolean;
                    success: boolean;
                }>
            >,
        ) => {
            state.quizStatus = { ...state.quizStatus, ...action.payload };
        },
    },
});

export const {
    setDisplayingCalendarMonths,
    setActivityReportColumns,
    changeTableWidthMode,
    setQuizStatus,
} = sharedSlice.actions;

export const sharedReducer = sharedSlice.reducer;
