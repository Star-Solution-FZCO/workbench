export function calculatePageCount(limit: number, count?: number) {
    return count ? Math.ceil(count / limit) : 0;
}
