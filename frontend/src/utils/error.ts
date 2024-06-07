import { renderError } from "_components/error";
import { defaultErrorMessage } from "config";
import { capitalize } from "lodash";
import { toast } from "react-toastify";
import {
    isQueryErrorT,
    isQueryStringErrorT,
    isQueryStringListErrorT,
} from "types";

export const toastError = (error: any) => {
    if ("data" in error) {
        if (isQueryStringErrorT(error))
            toast.error(capitalize(error.data.detail));

        if (isQueryStringListErrorT(error))
            error.data.detail.forEach((err: string) =>
                toast.error(capitalize(err)),
            );

        if (isQueryErrorT(error)) {
            toast.error(renderError(error));
        }
        return;
    }
    toast.error(defaultErrorMessage);
};
