import { Typography } from "@mui/material";
import React, { FC } from "react";
import { Link as RouterLink, To } from "react-router-dom";

interface ILinkProps extends React.PropsWithChildren {
    to: To;
}

const Link: FC<ILinkProps> = ({ to, children }) => {
    return (
        <RouterLink
            to={to}
            style={{
                textDecoration: "none",
            }}
        >
            <Typography
                sx={{
                    color: "#0052cc",
                    fontWeight: 500,
                    "&:hover": {
                        textDecoration: "underline",
                    },
                }}
            >
                {children}
            </Typography>
        </RouterLink>
    );
};

export { Link };
