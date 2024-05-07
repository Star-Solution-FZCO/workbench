import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    AccordionDetails,
    AccordionSummary,
    Accordion as MuiAccordion,
    Typography,
} from "@mui/material";
import { FC } from "react";

interface IAccordionProps extends React.PropsWithChildren {
    title: string;
    defaultExpanded?: boolean;
}

const Accordion: FC<IAccordionProps> = ({
    title,
    children,
    defaultExpanded,
}) => {
    return (
        <MuiAccordion
            sx={{
                borderRadius: "8px",
                "&:before": {
                    display: "none",
                },
            }}
            variant="outlined"
            defaultExpanded={defaultExpanded}
            disableGutters
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={500}>{title}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: 0 }}>{children}</AccordionDetails>
        </MuiAccordion>
    );
};

export { Accordion };
