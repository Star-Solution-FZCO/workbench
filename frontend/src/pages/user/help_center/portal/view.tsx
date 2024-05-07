import SettingsIcon from "@mui/icons-material/Settings";
import { TabContext, TabPanel } from "@mui/lab";
import {
    Box,
    Button,
    LinearProgress,
    Tab,
    Tabs,
    Typography,
    styled,
} from "@mui/material";
import { SearchField, initialListState } from "_components";
import { helpCenterApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { debounce } from "lodash";
import { FC, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiResponse, PortalT, ServiceT } from "types";
import {
    ArticleList,
    Link,
    ServiceList as PortalServiceList,
    ServiceCard,
} from "../components";

const paginationLimit = 5;

const StyledTab = styled(Tab)({
    "&.MuiTab-root": {
        textTransform: "none",
    },
});

interface IPortalDetailHeaderProps {
    portal: ApiResponse<PortalT>;
}

const PortalDetailHeader: FC<IPortalDetailHeaderProps> = ({ portal }) => {
    const navigate = useNavigate();

    const profile = useAppSelector((state) => state.profile.payload);
    const canEdit = profile.admin || profile.hr;

    return (
        <>
            <Box display="flex" alignItems="center" gap={1}>
                <Link to="/help-center">Help center</Link>
                <Link to="/help-center/requests">Requests</Link>

                {canEdit && (
                    <Button
                        onClick={() => navigate(`/help-center/admin/portals`)}
                        variant="outlined"
                        color="secondary"
                        size="small"
                        endIcon={<SettingsIcon />}
                    >
                        Admin Panel
                    </Button>
                )}
            </Box>

            <Typography variant="h6">{portal.payload.name}</Typography>
            <Typography>{portal.payload.description}</Typography>
        </>
    );
};

interface IServiceListProps {
    services: ServiceT[];
    loading: boolean;
}

const ServiceList: FC<IServiceListProps> = ({ services, loading }) => {
    if (loading) return <LinearProgress />;

    if (services.length === 0)
        return <Typography variant="h6">No matching search results</Typography>;

    return services.map((service) => (
        <ServiceCard key={service.id} service={service} />
    ));
};

const PortalView = () => {
    const { id } = useParams();

    const [tab, setTab] = useState<string>("");
    const [articlesPage, setArticlesPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    const [listState] = useState({
        ...initialListState,
        filter: {
            portal: `portal_id:${Number(id)}`,
            is_active: "is_active:true",
        },
    });

    const { data: portal } = helpCenterApi.useGetPortalQuery(Number(id));

    const { data: groups } = helpCenterApi.useListPortalGroupsQuery(
        makeListParams(listState, ["name___icontains"]),
    );

    const {
        data: services,
        isLoading: servicesLoading,
        isFetching: servicesFetching,
    } = helpCenterApi.useListServiceQuery(
        makeListParams(
            {
                ...listState,
                filter: {
                    portal_group: `portal_group_id___in:${groups?.payload?.items?.map(
                        (group) => group.id,
                    )}`,
                    is_active: "is_active:true",
                },
                search: searchQuery,
            },
            ["name___icontains", "description___icontains"],
        ),
        {
            skip: searchQuery.length === 0,
        },
    );

    const {
        data: articles,
        isLoading: articlesLoading,
        isFetching: articlesFetching,
    } = helpCenterApi.useSearchArticlesQuery(
        {
            start: articlesPage,
            limit: paginationLimit,
            query: searchQuery,
            portal_id: Number(id),
        },
        {
            skip: searchQuery.length === 0,
        },
    );

    const handleChange = (_: React.SyntheticEvent, newValue: string) => {
        setTab(newValue);
    };

    const search = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const handleChangeSearch = useCallback(debounce(search, 300), []);

    useEffect(() => {
        if (groups && groups.payload.items.length > 0) {
            setTab(groups.payload.items[0].id.toString());
        }
    }, [groups]);

    if (!groups?.payload) return null;

    if (portal && groups.payload.items.length === 0)
        return (
            <Box display="flex" flexDirection="column" gap={1}>
                <PortalDetailHeader portal={portal} />

                <Typography>
                    There are no request types configured for this service
                    project.
                </Typography>
            </Box>
        );

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            {portal && <PortalDetailHeader portal={portal} />}

            <SearchField onChange={handleChangeSearch} />

            {searchQuery.length === 0 && (
                <Box display="flex" gap={2}>
                    <TabContext value={tab}>
                        <Tabs
                            orientation="vertical"
                            variant="scrollable"
                            value={tab}
                            onChange={handleChange}
                            sx={{ borderRight: 1, borderColor: "divider" }}
                        >
                            {groups?.payload?.items.map((group) => (
                                <StyledTab
                                    key={group.id}
                                    label={group.name}
                                    value={group.id.toString()}
                                />
                            ))}
                        </Tabs>

                        {groups.payload.items.map((group) => (
                            <TabPanel
                                key={group.id}
                                value={group.id.toString()}
                                sx={{ p: 0 }}
                            >
                                <PortalServiceList group_id={group.id} />
                            </TabPanel>
                        ))}
                    </TabContext>
                </Box>
            )}

            {searchQuery.length > 0 && services && articles && (
                <>
                    {articles.payload.results.length > 0 && (
                        <ArticleList
                            articles={articles}
                            page={articlesPage}
                            onPageChange={(page) => setArticlesPage(page)}
                            limit={paginationLimit}
                            loading={articlesLoading || articlesFetching}
                        />
                    )}

                    {services.payload.items.length > 0 &&
                        articles.payload.results.length > 0 && (
                            <Typography fontWeight={500}>
                                Can't find what you need? Raise a request
                            </Typography>
                        )}

                    <ServiceList
                        services={services.payload.items}
                        loading={servicesLoading || servicesFetching}
                    />
                </>
            )}
        </Box>
    );
};

export default PortalView;
