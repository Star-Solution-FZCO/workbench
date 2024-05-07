import { Box, LinearProgress, Typography } from "@mui/material";
import { FC } from "react";
import { PortalT } from "types";
import { PortalCard } from "./portal_card";

interface IPortalListProps {
    portals: PortalT[];
    loading: boolean;
}

const PortalList: FC<IPortalListProps> = ({ portals, loading }) => {
    if (loading) return <LinearProgress />;

    if (portals.length === 0)
        return <Typography fontWeight={500}>No portals</Typography>;

    return (
        <Box display="flex" flexWrap="wrap" gap={4}>
            {portals.map((portal) => (
                <PortalCard key={portal.id} portal={portal} />
            ))}
        </Box>
    );
};

export { PortalList };
