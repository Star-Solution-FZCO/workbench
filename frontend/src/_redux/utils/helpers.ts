import { ListStateT } from "_components";
import { isArray, isEmpty, join, map, reduce, values } from "lodash";
import { ListRequestParamsT } from "types/api";

const filterToString = (value: { [key: string]: string }) =>
    join(values(value), " and ");

export const makeListParams = (
    params: ListStateT,
    search_columns: string[],
): ListRequestParamsT =>
    reduce(
        params,
        (acc: any, value, param) => {
            switch (param) {
                case "filter":
                    if (isEmpty(params.filter)) return acc;
                    if (acc.hasOwnProperty("filter"))
                        return {
                            ...acc,
                            filter: `${filterToString(params.filter)} and (${
                                acc.filter
                            })`,
                        };
                    return { ...acc, filter: filterToString(params.filter) };
                case "search":
                    if (!value) return acc;
                    const search = join(
                        map(search_columns, (field) => `${field}:"${value}"`),
                        " or ",
                    );
                    if (!search) return acc;
                    if (acc.hasOwnProperty("filter"))
                        return {
                            ...acc,
                            filter: `${acc.filter} and (${search})`,
                        };
                    return { ...acc, filter: search };
                case "sort_by":
                    if (!value || !isArray(value)) return acc;
                    return {
                        ...acc,
                        sort_by: join(
                            map(value, ({ columnKey, direction }) =>
                                direction === "DESC"
                                    ? "-" + columnKey
                                    : columnKey,
                            ),
                            ",",
                        ),
                    };
                default:
                    return { ...acc, [param]: value };
            }
        },
        {},
    );
