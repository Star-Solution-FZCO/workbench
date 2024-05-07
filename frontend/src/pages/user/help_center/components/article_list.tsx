import { Box, LinearProgress, Pagination, Typography } from "@mui/material";
import { FC } from "react";
import { ApiResponse, ArticlesResponseT } from "types";
import { calculatePageCount } from "utils";
import { Article } from "./article";

interface IArticleListProps {
    articles: ApiResponse<ArticlesResponseT>;
    page: number;
    onPageChange: (page: number) => void;
    limit: number;
    loading: boolean;
}

const ArticleList: FC<IArticleListProps> = ({
    articles,
    page,
    onPageChange,
    limit,
    loading,
}) => {
    return (
        <Box display="flex" flexDirection="column" gap={1} width="100%">
            <Typography variant="h6">Suggested articles</Typography>

            {loading ? (
                <LinearProgress />
            ) : (
                <Box display="flex" flexDirection="column" gap={3}>
                    {articles.payload.results.map((article) => (
                        <Article
                            article={article}
                            baseURL={articles.payload._links.base}
                        />
                    ))}
                </Box>
            )}

            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
            >
                {articles.payload.totalSize > 0 && (
                    <Pagination
                        page={page}
                        count={calculatePageCount(
                            limit,
                            articles.payload.totalSize,
                        )}
                        onChange={(_, page) => onPageChange(page)}
                    />
                )}

                <Typography>
                    Total results: {articles.payload.totalSize}
                </Typography>
            </Box>
        </Box>
    );
};

export { ArticleList };
