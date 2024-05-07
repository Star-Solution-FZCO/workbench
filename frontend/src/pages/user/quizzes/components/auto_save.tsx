import { debounce } from "lodash";
import { FC, useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import useDeepCompareEffect from "use-deep-compare-effect";

interface IAutoSaveProps {
    onSave: (formData: any) => void;
    callbackDeps?: any[];
}
const AutoSave: FC<IAutoSaveProps> = ({
    onSave: onSubmit,
    callbackDeps = [],
}) => {
    const methods = useFormContext();

    const debouncedSave = useCallback(
        debounce(() => {
            methods.handleSubmit(onSubmit)();
        }, 1000),
        callbackDeps,
    );

    const watchedData = useWatch({
        control: methods.control,
    });

    useDeepCompareEffect(() => {
        if (methods.formState.isDirty) {
            debouncedSave();
        }
    }, [watchedData]);

    return null;
};

export { AutoSave };
