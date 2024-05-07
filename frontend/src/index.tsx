import "@fontsource/roboto/latin-400.css";
import "@fontsource/roboto/latin-500.css";
import { LicenseInfo } from "@mui/x-license";
import * as Sentry from "@sentry/react";
import AppErrorBoundary from "_components/error_boundary";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import {
    createRoutesFromChildren,
    matchRoutes,
    useLocation,
    useNavigationType,
} from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import App from "./App";
import { store } from "./_redux";
import { MUI_X_LICENSE_KEY, SENTRY_DSN } from "./config";
import "./index.css";

LicenseInfo.setLicenseKey(MUI_X_LICENSE_KEY);

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement,
);

Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
        new Sentry.BrowserTracing({
            routingInstrumentation: Sentry.reactRouterV6Instrumentation(
                React.useEffect,
                useLocation,
                useNavigationType,
                createRoutesFromChildren,
                matchRoutes,
            ),
        }),
        new Sentry.Replay(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enabled: import.meta.env.MODE === "production",
});

root.render(
    <AppErrorBoundary>
        <Provider store={store}>
            <React.StrictMode>
                <App />
            </React.StrictMode>
        </Provider>
    </AppErrorBoundary>,
);
