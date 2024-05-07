import appConstants, { loginPageUrl } from "config";
import {
    Navigate,
    Outlet,
    ScrollRestoration,
    createSearchParams,
    useLocation,
} from "react-router-dom";

export const AuthPrivateRoute = () => {
    const location = useLocation();

    const token = localStorage.getItem(appConstants["profileKeyName"]);

    const to =
        window.location.pathname !== "/"
            ? {
                  pathname: loginPageUrl,
                  search: createSearchParams({
                      redirectTo: location.pathname + location.search,
                  }).toString(),
              }
            : loginPageUrl;

    return token ? (
        <>
            <ScrollRestoration />
            <Outlet />
        </>
    ) : (
        <Navigate to={to} />
    );
};
