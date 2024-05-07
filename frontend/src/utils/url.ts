import { STORAGE_URL } from "config";

export const avatarUrl = (id: number, size: number = 100): string => {
    return `/avatar?id=${id}&size=${size}`;
};

export const storageUrl = (
    url: string | null | undefined,
): string | undefined => {
    if (!url) return;
    return `${STORAGE_URL ? STORAGE_URL : "/storage"}/${url.replace(
        /^\/+/,
        "",
    )}`;
};
