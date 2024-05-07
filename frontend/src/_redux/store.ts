import {
    AnyAction,
    Dispatch,
    Middleware,
    configureStore,
} from "@reduxjs/toolkit";
import { createLogger } from "redux-logger";
import {
    adminRequestApi,
    catalogsApi,
    employeesApi,
    helpCenterApi,
    policiesApi,
    reportsApi,
    requestsApi,
    scheduleApi,
    sharedApi,
} from "./api";
import { profileReducer, sharedReducer } from "./slices";

const logger = createLogger();

export const store = configureStore({
    reducer: {
        profile: profileReducer,
        shared: sharedReducer,
        [adminRequestApi.reducerPath]: adminRequestApi.reducer,
        [catalogsApi.reducerPath]: catalogsApi.reducer,
        [employeesApi.reducerPath]: employeesApi.reducer,
        [helpCenterApi.reducerPath]: helpCenterApi.reducer,
        [policiesApi.reducerPath]: policiesApi.reducer,
        [reportsApi.reducerPath]: reportsApi.reducer,
        [requestsApi.reducerPath]: requestsApi.reducer,
        [scheduleApi.reducerPath]: scheduleApi.reducer,
        [sharedApi.reducerPath]: sharedApi.reducer,
    },
    devTools: import.meta.env.DEV,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({})
            .prepend(
                import.meta.env.MODE === "test"
                    ? [logger as Middleware<any, any, Dispatch<AnyAction>>]
                    : [],
            )
            .concat([
                adminRequestApi.middleware,
                catalogsApi.middleware,
                employeesApi.middleware,
                helpCenterApi.middleware,
                policiesApi.middleware,
                reportsApi.middleware,
                requestsApi.middleware,
                scheduleApi.middleware,
                sharedApi.middleware,
            ]),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
