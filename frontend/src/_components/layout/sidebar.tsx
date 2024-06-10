import {
    Box,
    CircularProgress,
    Divider,
    Drawer,
    List,
    Theme,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { sharedApi } from "_redux";
import appConstants, { APP_VERSION } from "config";
import { map } from "lodash";
import React, { useMemo } from "react";
import { useMatch } from "react-router-dom";
import { FordableNavItem, NavItem, NavItemT } from "./navitem";

type SidebarPropsT = {
    items: NavItemT[];
    open: boolean;
    onClose: () => void;
};

export const Sidebar: React.FC<SidebarPropsT> = ({ open, items, onClose }) => {
    const isAdminArea = useMatch("/admin/*");

    const { data: versionData, isLoading: versionIsLoading } =
        sharedApi.useGetVersionQuery();

    const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"), {
        defaultMatches: true,
        noSsr: false,
    });

    const navItems = useMemo(
        () =>
            map(
                items,
                ({ subItems, title, icon, href, exact, params, external }) =>
                    subItems ? (
                        <FordableNavItem
                            key={title}
                            {...{
                                title,
                                icon,
                                href,
                                exact,
                                params,
                                subItems,
                            }}
                            onSidebarClose={onClose}
                        />
                    ) : (
                        <NavItem
                            key={title}
                            {...{ title, icon, href, exact, params, external }}
                            onSidebarClose={onClose}
                        />
                    ),
            ),
        [items, onClose],
    );

    const content = useMemo(
        () => (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                }}
            >
                <Box sx={{ height: 64 }}>
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="start"
                        height="100%"
                        pl={3}
                    >
                        {isAdminArea && (
                            <Typography color="neutral.300" fontWeight={600}>
                                Admin Site
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ borderColor: "#2D3748" }} />

                <Box sx={{ flexGrow: 1 }}>
                    <List sx={{ p: 0 }}>{navItems}</List>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        marginTop: "auto",
                        alignItems: "center",
                        marginBottom: 1,
                    }}
                >
                    <Typography>Version</Typography>
                    <Typography>Frontend: {APP_VERSION}</Typography>
                    <Typography>
                        Backend:{" "}
                        {versionIsLoading ? (
                            <CircularProgress size={12} />
                        ) : (
                            versionData?.payload?.version || "unknown"
                        )}
                    </Typography>
                </Box>
            </Box>
        ),
        [isAdminArea, navItems, versionIsLoading],
    );

    if (lgUp) {
        return (
            <Drawer
                open
                anchor="left"
                PaperProps={{
                    sx: {
                        backgroundColor: "neutral.900",
                        color: "#FFFFFF",
                        width: appConstants.sideBarSize,
                    },
                }}
                variant="permanent"
            >
                {content}
            </Drawer>
        );
    }

    return (
        <Drawer
            anchor="left"
            onClose={onClose}
            open={open}
            PaperProps={{
                sx: {
                    backgroundColor: "neutral.900",
                    color: "#FFFFFF",
                    width: appConstants.sideBarSize,
                },
            }}
            sx={{ zIndex: (theme) => theme.zIndex.appBar + 100 }}
            variant="temporary"
        >
            {content}
        </Drawer>
    );
};
