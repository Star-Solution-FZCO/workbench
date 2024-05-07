import { Box, Link, Typography } from "@mui/material";
import { FC } from "react";
import { ArticleT } from "types";
import { parseConfluenceHighlight } from "utils/convert";

const CustomLink: FC<{ url: string } & React.PropsWithChildren> = ({
    url,
    children,
}) => {
    return (
        <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
                alignSelf: "flex-start",
                textDecoration: "none",
                "&:hover": {
                    textDecoration: "underline",
                },
            }}
        >
            {children}
        </Link>
    );
};

interface IArticleProps {
    article: ArticleT;
    baseURL: string;
}

const Article: FC<IArticleProps> = ({ article, baseURL }) => {
    return (
        <Box display="flex" flexDirection="column">
            <Box>
                <CustomLink url={baseURL + article.url}>
                    <Typography fontSize={18}>
                        {parseConfluenceHighlight(article.title)}
                    </Typography>
                </CustomLink>
                Source: <CustomLink url={baseURL}>{baseURL}</CustomLink>
            </Box>

            <Typography color="#707070">
                {parseConfluenceHighlight(article.excerpt)}
            </Typography>
        </Box>
    );
};

export { Article };
