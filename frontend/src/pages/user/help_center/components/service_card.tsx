import { Box, Typography } from "@mui/material";
import { FC, memo } from "react";
import { Link } from "react-router-dom";
import { ServiceT } from "types";

interface IServiceCardprops {
    service: ServiceT;
    showPortalName?: boolean;
}

const ServiceCard: FC<IServiceCardprops> = memo(
    ({ service, showPortalName }) => {
        return (
            <Link
                to={`/help-center/services/${service.id}/apply`}
                style={{ textDecoration: "none", color: "inherit" }}
            >
                <Box
                    display="flex"
                    alignItems="flex-start"
                    gap={1}
                    sx={{
                        "& img": {
                            width: "64px",
                            height: "64px",
                            padding: "4px",
                            objectFit: "contain",
                        },
                    }}
                >
                    <img src={service.icon} alt={service.name} />

                    <Box>
                        <Typography
                            sx={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: "#2196f3",
                                "&:hover": {
                                    textDecoration: "underline",
                                },
                            }}
                        >
                            {service.name}
                            {showPortalName &&
                                ` - ${service.group.portal.name}`}
                        </Typography>

                        <Typography>{service.short_description}</Typography>
                    </Box>
                </Box>
            </Link>
        );
    },
);

export { ServiceCard };
