import { Box, Typography } from "@mui/material";
import { FC } from "react";
import { Link } from "react-router-dom";
import { PortalT } from "types";

interface IPortalCardProps {
    portal: PortalT;
}

const PortalCard: FC<IPortalCardProps> = ({ portal }) => {
    return (
        <Link
            to={`/help-center/portal/${portal.id}`}
            style={{ textDecoration: "none" }}
        >
            <Box
                display="flex"
                flexDirection="column"
                gap={1}
                boxShadow={3}
                p={3}
                width="24rem"
                sx={{
                    transition: "all .15s ease-in-out",
                    "&:hover": {
                        boxShadow: 6,
                        transform: "translateY(-4px)",
                    },
                }}
            >
                <Typography fontSize={18} fontWeight={500} color="#0052cc">
                    {portal.name}
                </Typography>

                <Typography color="initial">{portal.description}</Typography>
            </Box>
        </Link>
    );
};

export { PortalCard };
