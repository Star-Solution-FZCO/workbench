export type SortDirection = "ASC" | "DESC";

export interface SortColumn {
    readonly columnKey: string;
    readonly direction: SortDirection;
}

export type ListStateT = {
    search: string;
    filter: { [key: string]: string };
    limit: number;
    offset: number;
    sort_by: SortColumn[];
};

export const initialListState: ListStateT = {
    search: "",
    filter: {},
    limit: 50,
    offset: 0,
    sort_by: [],
};
