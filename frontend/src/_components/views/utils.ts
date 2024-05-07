import { omit } from "lodash";
import React from "react";
import { ListStateT } from "./list";

export const switchFilter =
    (
        field: string,
        value: string,
        listState: ListStateT,
        setListState: (
            value: ((prevState: ListStateT) => ListStateT) | ListStateT,
        ) => void,
    ) =>
    (_: React.SyntheticEvent, checked: boolean) => {
        if (checked)
            return setListState({
                ...listState,
                filter: { ...listState.filter, [field]: value },
            });
        setListState({ ...listState, filter: omit(listState.filter, field) });
    };

export const switchFilterDisabled =
    (
        field: string,
        value: string,
        listState: ListStateT,
        setListState: (
            value: ((prevState: ListStateT) => ListStateT) | ListStateT,
        ) => void,
    ) =>
    (_: React.SyntheticEvent, checked: boolean) => {
        if (!checked)
            return setListState({
                ...listState,
                filter: { ...listState.filter, [field]: value },
            });
        setListState({ ...listState, filter: omit(listState.filter, field) });
    };

export const isFilterSet = (field: string, listState: ListStateT): boolean =>
    !!listState.filter[field];
