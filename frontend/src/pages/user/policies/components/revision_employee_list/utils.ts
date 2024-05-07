import { initialListState as _initialListState } from "_components";
import { UserInfoT } from "types";

export type TabT = "employees" | "exclusions";
export type NestedModalTypeT = "exclusion" | "notification" | null;
export type ActionTypeT = "exclude" | "restore" | null;
export type SelectedEmployeeT =
    | (UserInfoT & { approved?: string | null; excluded?: string | null })
    | null;
export type ApprovedFilterT = "all" | "approved" | "not_approved";
export type ExcludedFilterT = "excluded" | "not_excluded";

export const initialListState = {
    ..._initialListState,
    filter: { active: "active:true" },
};

export const defaultModalStyles = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "background.paper",
    padding: 2,
    borderRadius: 1,
};

export function transformFilterValue(value: string): boolean | undefined {
    if (value === "all") return undefined;
    if (value.includes("not")) return false;
    return true;
}
