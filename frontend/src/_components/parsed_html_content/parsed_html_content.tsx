import { Box } from "@mui/material";
import { FC } from "react";
import { parseHTML } from "utils/convert";
import "./parsed_html_content.scss";

interface IParsedContentProps {
    text: string;
}

const ParsedHTMLContent: FC<IParsedContentProps> = ({ text }) => {
    return <Box className="parsed_html_content">{parseHTML(text)}</Box>;
};

export { ParsedHTMLContent };
