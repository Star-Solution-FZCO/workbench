import { capitalize } from "lodash";
import { QueryErrorT } from "types";

export const renderError = (error: QueryErrorT) =>
    error.data.detail
        .map((err) => `${capitalize(err.loc[1])}: ${err.msg}\n`)
        .join("");
