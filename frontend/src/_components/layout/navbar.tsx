import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import UpdateIcon from "@mui/icons-material/Update";
import {
    AppBar,
    AppBarTypeMap,
    Avatar,
    Box,
    IconButton,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";
import { styled } from "@mui/system";
import {
    adminRequestApi,
    authActions,
    catalogsApi,
    employeesApi,
    helpCenterApi,
    policiesApi,
    reportsApi,
    requestsApi,
    scheduleApi,
    sharedApi,
    useAppDispatch,
    useAppSelector,
} from "_redux";
import appConstants, { loginPageUrl } from "config";
import React from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "theme";
import { storageUrl } from "utils/url";

const NavbarRoot = styled(AppBar)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
}));

type NavbarPropsT = {
    onSidebarOpen: (event: React.MouseEvent) => void;
    navBarProps?: AppBarTypeMap;
};

export const Navbar: React.FC<NavbarPropsT> = ({
    onSidebarOpen,
    navBarProps,
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const profile = useAppSelector(({ profile }) => profile.payload);

    const handleLogout = () => {
        authActions.logout();
        dispatch(adminRequestApi.util.resetApiState());
        dispatch(catalogsApi.util.resetApiState());
        dispatch(employeesApi.util.resetApiState());
        dispatch(helpCenterApi.util.resetApiState());
        dispatch(policiesApi.util.resetApiState());
        dispatch(reportsApi.util.resetApiState());
        dispatch(requestsApi.util.resetApiState());
        dispatch(scheduleApi.util.resetApiState());
        dispatch(sharedApi.util.resetApiState());
        navigate(loginPageUrl);
    };

    return (
        <NavbarRoot
            sx={{
                left: { lg: appConstants.sideBarSize },
                width: { lg: `calc(100% - ${appConstants.sideBarSize}px)` },
            }}
            {...navBarProps}
        >
            <Toolbar sx={{ minHeight: 64, left: 0, px: 2 }} disableGutters>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <IconButton
                        onClick={onSidebarOpen}
                        sx={{ display: { xs: "inline-flex", lg: "none" } }}
                    >
                        <MenuIcon fontSize="small" />
                    </IconButton>

                    <Tooltip title="Dashboard">
                        <IconButton onClick={() => navigate("/")}>
                            <DashboardIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Box flex="1" />

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <Typography
                        fontWeight={500}
                        fontSize={16}
                        color={theme.palette.action.active}
                    >
                        {profile.english_name}
                    </Typography>

                    <IconButton onClick={() => navigate("/profile")}>
                        <Avatar
                            sx={{ height: 40, width: 40 }}
                            src={storageUrl(profile.photo)}
                        >
                            <AccountCircleIcon />
                        </Avatar>
                    </IconButton>

                    <Tooltip title="Changelog">
                        <IconButton onClick={() => navigate("/changelog")}>
                            <UpdateIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Settings">
                        <IconButton onClick={() => navigate("/settings")}>
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>

                    {/* <NotificationsMenu /> */}

                    <Tooltip title="Logout">
                        <IconButton onClick={handleLogout}>
                            <LogoutIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </NavbarRoot>
    );
};
