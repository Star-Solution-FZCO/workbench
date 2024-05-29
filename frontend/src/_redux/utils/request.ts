import axios, { AxiosError, AxiosResponse } from "axios";
import appConstants, {
    API_BASE_URL,
    excludedStorageKeysFromClear,
    loginPageUrl,
} from "config";
import Cookies from "js-cookie";
import { ProfileModelT } from "types/models";
import {
    ErrorResponseT,
    MethodT,
    ParamsT,
    RequestParamsT,
    ResponseT,
} from "./request.d";

const profileKeyName = appConstants["profileKeyName"];

export const removeAuthorizationInfo = () => {
    _request<{ success: boolean }>({
        url: "/auth/logout",
    }).finally(() => {
        for (const key of Object.keys(localStorage)) {
            if (
                !excludedStorageKeysFromClear.find(
                    (excludedKey) => key.match(excludedKey) !== null,
                )
            ) {
                localStorage.removeItem(key);
            }
        }

        if (window.location.pathname !== loginPageUrl) {
            // return back to the same page where the token expired
            // the private route authentication logic will start again
            window.location.assign(
                window.location.pathname + window.location.search,
            );
        }
    });
};

export const setProfileInfo = (profile: ProfileModelT): ProfileModelT => {
    localStorage.setItem(profileKeyName, JSON.stringify(profile));
    return profile;
};

export async function refreshAccessToken(): Promise<void> {
    const headers: { [key: string]: string } = {};
    const csrfRefreshToken = Cookies.get("csrf_refresh_token");
    if (csrfRefreshToken) {
        headers["X-CSRF-TOKEN"] = csrfRefreshToken;
    }
    return await _request<{ success: boolean }>(
        { url: "/auth/refresh", headers },
        true,
    )
        .then(() => {})
        .catch(() => removeAuthorizationInfo());
}

const _request = <T>(
    {
        url,
        method = "get",
        data = {},
        params = {},
        headers = {},
        onUploadProgress,
        signal,
    }: RequestParamsT,
    stopOnError?: boolean,
): Promise<T> => {
    if (method === "get" && Object.keys(data).length) {
        method = "post";
    }

    let url_ = `/api/${url?.replace(/^\//, "")}`;

    if (API_BASE_URL && API_BASE_URL !== "") {
        url_ = new URL(url_, API_BASE_URL).toString();
    }

    const csrfAccessToken = Cookies.get("csrf_access_token");
    if (csrfAccessToken) {
        headers["X-CSRF-TOKEN"] = csrfAccessToken;
    }

    return axios({
        url: url_,
        method,
        data,
        params,
        headers,
        onUploadProgress,
        signal,
        withCredentials: true,
    })
        .then(
            (
                response: AxiosResponse<
                    ResponseT<T, { error: string; type: string }>
                >,
            ) => {
                if (!response.data) throw new AxiosError("Empty Response");
                return response.data.payload;
            },
        )
        .catch(async (error: AxiosError<ErrorResponseT<any>>) => {
            const { response, config } = error;
            const baseURL = API_BASE_URL || window.location.href;
            const requestURL = new URL(config?.url || "", baseURL);

            if (response) {
                if (
                    response.status === 401 &&
                    response.data.error &&
                    response.data.error.type === "token_expired" &&
                    !stopOnError
                ) {
                    return await refreshAccessToken().then(() =>
                        _request({ url, method, data, params }, true),
                    );
                }

                if (
                    response.status === 401 &&
                    requestURL.pathname !== "/api/auth/logout"
                )
                    removeAuthorizationInfo();
                throw response.data;
            }
            throw error.message;
        });
};

export function requestRefreshToken<T>(
    login: string,
    password: string,
    remember: boolean,
): Promise<T> {
    return _request({
        url: "/auth/login",
        data: { login, password, remember },
    });
}

export function sendRegistrationRequest(
    register_token: string,
    password: string,
): Promise<{ success: boolean }> {
    return _request<{ success: boolean }>(
        { url: "/auth/register", data: { register_token, password } },
        true,
    );
}

export function request<T>(url: string): Promise<T>;
export function request<T>(params: RequestParamsT): Promise<T>;
export function request<T>(url: string, method?: MethodT): Promise<T>;
export function request<T>(
    url: string,
    method?: MethodT,
    data?: Object,
): Promise<T>;
export function request<T>(
    url: string | RequestParamsT,
    method?: MethodT,
    data?: Object,
    params?: ParamsT,
): Promise<T> {
    if (typeof url === "object") return _request(url);
    return _request({ url, method, data, params });
}
