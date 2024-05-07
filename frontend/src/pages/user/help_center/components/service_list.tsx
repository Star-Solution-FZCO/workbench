import { Box, LinearProgress, Typography } from "@mui/material";
import { initialListState } from "_components";
import { helpCenterApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { FC } from "react";
import { ServiceCard } from "./service_card";

interface IServiceListProps {
    group_id: number;
}

const ServiceList: FC<IServiceListProps> = ({ group_id }) => {
    const { data: services, isLoading } = helpCenterApi.useListServiceQuery(
        makeListParams(
            {
                ...initialListState,
                filter: {
                    portal_group: `portal_group_id:${group_id}`,
                    is_active: "is_active:true",
                },
            },
            [],
        ),
    );

    if (isLoading) return <LinearProgress />;

    if (!services)
        return <Typography variant="h6">Failed to load services</Typography>;

    if (services.payload.items.length === 0) {
        return <Typography variant="h6">No services</Typography>;
    }

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            {services.payload.items.map((service) => (
                <ServiceCard key={service.id} service={service} />
            ))}
        </Box>
    );
};

export { ServiceList };
