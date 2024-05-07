import { intersection } from "lodash";

const emailPattern =
    /[a-z\d!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z\d!#$%&'*+/=?^_`{|}~-]+)*@(?:(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z\d](?:[a-z\d-]*[a-z\d])?|\[(?:(2(5[0-5]|[0-4]\d)|1\d\d|[1-9]?\d)\.){3}(?:(2(5[0-5]|[0-4]\d)|1\d\d|[1-9]?\d)|[a-z\d-]*[a-z\d]+)])/;

export const validateEmail = (value: string) =>
    emailPattern.test(value) || "invalid email address";

export const hasAccessByRoles = (
    accessRoles: string[],
    userRoles: string[],
): boolean => {
    return !!intersection(accessRoles, userRoles).length;
};
