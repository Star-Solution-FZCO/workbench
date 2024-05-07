import { ListStateT, initialListState } from "_components";
import { theme } from "theme";

export const requestListInitialParams: ListStateT = {
    ...initialListState,
    filter: { status: "status:NEW" },
    sort_by: [{ columnKey: "updated", direction: "DESC" }],
};

export const requestIconColor = (status: string) => {
    switch (status) {
        case "NEW":
            return theme.palette.warning.light;
        case "CANCELED":
            return theme.palette.error.light;
        case "CLOSED":
            return theme.palette.grey["500"];
        case "APPROVED":
            return theme.palette.success.light;
    }
};
