import { FormControlLabel, Radio } from "@mui/material";
import { FC } from "react";
import { TakeQuizQuestionOptionT } from "types";

interface IOptionProps {
    option: TakeQuizQuestionOptionT;
    checked: boolean;
    onClick: (option_id: number) => void;
}

const Option: FC<IOptionProps> = ({ option, checked, onClick }) => {
    return (
        <FormControlLabel
            sx={{ border: "1px solid #ccc", borderRadius: 1, p: 1, m: 0 }}
            value={option.id}
            control={<Radio />}
            label={option.content}
            checked={checked}
            onClick={() => onClick(option.id)}
        />
    );
};

export { Option };
