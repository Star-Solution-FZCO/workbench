import SearchIcon from "@mui/icons-material/Search";
import { Box, Typography, debounce } from "@mui/material";
import { SearchField, initialListState } from "_components";
import { helpCenterApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { useCallback, useState } from "react";
import { ArticleList, PortalList, ServiceCard } from "./components";
import LastRequests from "./components/last_requests";

const paginationLimit = 5;

const HelpCenterMain = () => {
    const [listState] = useState(initialListState);
    const [searchQuery, setSearchQuery] = useState("");
    const [articlesPage, setArticlesPage] = useState(1);

    const { data: portals, isLoading: portalsLoading } =
        helpCenterApi.useListPortalsQuery(
            makeListParams(
                { ...listState, filter: { is_active: "is_active:true" } },
                [],
            ),
        );

    const {
        data: articles,
        isLoading: articlesLoading,
        isFetching: articlesFetching,
    } = helpCenterApi.useSearchArticlesQuery(
        { start: articlesPage, limit: paginationLimit, query: searchQuery },
        {
            skip: searchQuery.length === 0,
        },
    );

    const { data: services } = helpCenterApi.useListServiceQuery(
        makeListParams({ ...listState, limit: 5, search: searchQuery }, [
            "name___icontains",
            "description___icontains",
            "tags___icontains",
        ]),
        {
            skip: searchQuery.length === 0,
        },
    );

    const search = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
        if (articlesPage !== 1) setArticlesPage(1);
    };

    const handleChangeSearch = useCallback(debounce(search, 300), []);

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <LastRequests />

            <Typography variant="h6">What do you need help with?</Typography>

            <Box display="flex" gap={1}>
                <SearchField
                    placeholder="Type to start search. You can search for articles and services you need"
                    onChange={handleChangeSearch}
                    onClear={() => setSearchQuery("")}
                    loading={articlesLoading}
                    size="medium"
                    clearable
                />
            </Box>

            {searchQuery.length === 0 && (
                <>
                    <Typography fontWeight={500}>All portals</Typography>

                    <PortalList
                        portals={portals?.payload?.items || []}
                        loading={portalsLoading}
                    />
                </>
            )}

            {searchQuery.length > 0 && (
                <>
                    {articles && articles.payload.results.length > 0 && (
                        <ArticleList
                            articles={articles}
                            page={articlesPage}
                            onPageChange={(page) => setArticlesPage(page)}
                            limit={paginationLimit}
                            loading={articlesLoading || articlesFetching}
                        />
                    )}

                    {services && services.payload.items.length > 0 && (
                        <>
                            <Typography fontWeight={500}>
                                Can't find what you need? Raise a request
                            </Typography>

                            {services.payload.items.map((service) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    showPortalName
                                />
                            ))}
                        </>
                    )}
                </>
            )}

            {searchQuery.length > 0 &&
                articles &&
                articles.payload.results.length === 0 &&
                services &&
                services.payload.items.length === 0 && (
                    <>
                        <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            gap={1}
                            width="100%"
                        >
                            <SearchIcon color="info" fontSize="large" />
                            <Typography variant="h6">
                                No matching search results
                            </Typography>
                        </Box>

                        <Typography fontWeight={500}>All portals</Typography>

                        <PortalList
                            portals={portals?.payload?.items || []}
                            loading={portalsLoading}
                        />
                    </>
                )}
        </Box>
    );
};

export default HelpCenterMain;
