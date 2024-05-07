import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { Box } from "@mui/material";
import { FC } from "react";
import "./pointer.css";

interface IPointerProps extends React.PropsWithChildren {
    show?: boolean;
}

const Pointer: FC<IPointerProps> = ({ show, children }) => {
    return (
        <Box position="relative">
            {show && (
                <Box>
                    <ArrowDownwardIcon className="pointer floating" />
                </Box>
            )}
            {children}
        </Box>
    );
};

export { Pointer };
