import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ProfileModelT } from "types/models";

type ProfileSliceT = {
    payload: ProfileModelT;
    loaded: boolean;
    inProgress: boolean;
    error: string | null;
};

const initialState: ProfileSliceT = {
    payload: JSON.parse(localStorage.getItem("profile") || "{}"),
    loaded: false,
    inProgress: true,
    error: null,
};

const profileSlice = createSlice({
    name: "profile",
    initialState,
    reducers: {
        profileLoadInProgress: (state) => {
            state.inProgress = true;
        },
        profileLoaded: (state, { payload }: PayloadAction<ProfileModelT>) => {
            state.inProgress = false;
            state.loaded = true;
            state.payload = payload;
        },
        profileLoadError: (state) => {
            state.inProgress = false;
        },
    },
});

export const { profileLoaded } = profileSlice.actions;
export const profileReducer = profileSlice.reducer;
