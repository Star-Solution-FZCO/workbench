import { Box, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import React, { useState } from "react";
import appConstants from "../../config";
import { Navbar } from "./navbar";
import { NavItemT } from "./navitem";
import { Sidebar } from "./sidebar";

const LayoutRoot = styled("div")(({ theme }) => ({
    display: "flex",
    flex: "1 1 auto",
    maxWidth: "100%",
    height: "100%",
    paddingTop: 64,
    [theme.breakpoints.up("lg")]: {
        paddingLeft: appConstants.sideBarSize,
    },
}));

export const BaseLayout: React.FC<{
    sideBarItems: NavItemT[];
    children: React.ReactNode;
}> = ({ children, sideBarItems }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const theme = useTheme();

    return (
        <>
            <LayoutRoot>
                <Box
                    sx={{
                        display: "flex",
                        flex: "1 1 auto",
                        flexDirection: "column",
                        width: "100%",
                    }}
                >
                    <Box
                        sx={{
                            m: 1,
                            p: 1,
                            height: "100%",
                            overflow: "auto",
                            boxShadow: theme.shadows[1],
                            backgroundColor: theme.palette.background.paper,
                            scrollBehavior: "smooth",
                        }}
                    >
                        {children}
                    </Box>
                </Box>
            </LayoutRoot>

            <Navbar onSidebarOpen={() => setSidebarOpen(true)} />

            <Sidebar
                open={isSidebarOpen}
                items={sideBarItems}
                onClose={() => setSidebarOpen(false)}
            />
        </>
    );
};
