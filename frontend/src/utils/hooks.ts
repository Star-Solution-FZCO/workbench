import { useCallback, useEffect, useRef } from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";

export const usePrompt = (message: string | boolean) => {
    const blocker = useBlocker(
        useCallback(
            () =>
                typeof message === "string" ? !window.confirm(message) : false,
            [message],
        ),
    );

    const prevState = useRef(blocker.state);

    useEffect(() => {
        if (blocker.state === "blocked") {
            blocker.reset();
        }
        prevState.current = blocker.state;
    }, [blocker]);

    useBeforeUnload(
        useCallback(
            (event) => {
                if (typeof message === "string") {
                    event.preventDefault();
                    event.returnValue = message;
                }
            },
            [message],
        ),
        { capture: true },
    );
};
