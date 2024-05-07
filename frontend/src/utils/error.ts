import { renderError } from "_components/error";
import { defaultErrorMessage } from "config";
import { capitalize } from "lodash";
import { toast } from "react-toastify";
import { isQueryErrorT, isQueryStringErrorT } from "types";

export const toastError = (error: any) => {
    if ("data" in error) {
        if (isQueryStringErrorT(error))
            toast.error(capitalize(error.data.detail));

        if (isQueryErrorT(error)) {
            toast.error(renderError(error));
        }
        return;
    }
    toast.error(defaultErrorMessage);
};
