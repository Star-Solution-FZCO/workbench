import { FC } from "react";
import { usePrompt } from "utils";

interface IPromptProps {
    when: boolean;
    message: string;
}
const Prompt: FC<IPromptProps> = ({ when, message }) => {
    usePrompt(when ? message : false);
    return null;
};

export { Prompt };
