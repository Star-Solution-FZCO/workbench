import {
    BaseQueryFn,
    FetchArgs,
    fetchBaseQuery,
    FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import { API_BASE_URL } from "config";
import Cookies from "js-cookie";
import { QueryErrorT } from "types";
import { refreshAccessToken } from "../utils";

const baseQuery = (baseUrl?: string) => {
    const headers: { [key: string]: string } = {};
    const csrfAccessToken = Cookies.get("csrf_access_token");
    if (csrfAccessToken) {
        headers["X-CSRF-TOKEN"] = csrfAccessToken;
    }
    return fetchBaseQuery({
        baseUrl: baseUrl ? baseUrl : API_BASE_URL ? API_BASE_URL : "/api",
        credentials: "include",
        headers,
    });
};

export const getCustomFetchBase = (baseUrl?: string) => {
    const customFetchBase: BaseQueryFn<
        string | FetchArgs,
        unknown,
        FetchBaseQueryError
    > = async (args, api, extraOptions) => {
        let result = await baseQuery(baseUrl)(args, api, extraOptions);

        if (
            result.error?.status === 401 &&
            (result.error as QueryErrorT)?.data.type === "token_expired"
        ) {
            await refreshAccessToken().then(async () => {
                result = await baseQuery(baseUrl)(args, api, extraOptions);
            });
        }

        return result;
    };

    return customFetchBase;
};

export default getCustomFetchBase();
