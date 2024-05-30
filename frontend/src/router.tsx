import {
    Navigate,
    Route,
    createBrowserRouter,
    createRoutesFromElements,
    useRouteError,
} from "react-router-dom";
import { loginPageUrl } from "./config";
import { AuthPrivateRoute, LoginPage, RegisterPage } from "./pages";
import JSONGenerator from "./pages/json_editor";
import PasswordGenerator from "./pages/password_generator";
import { UserRouter } from "./pages/user";

const RouterErrorBoundary = () => {
    const error = useRouteError();

    if (error) {
        throw error;
    }

    return null;
};

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route ErrorBoundary={RouterErrorBoundary}>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/logout" element={<Navigate to={loginPageUrl} />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/password-generator" element={<PasswordGenerator />} />
            <Route path="/json-editor" element={<JSONGenerator />} />

            {/* App routes */}
            <Route path="/*" element={<AuthPrivateRoute />}>
                <Route path="*" element={<UserRouter />} />
            </Route>
        </Route>,
    ),
);

export default router;
