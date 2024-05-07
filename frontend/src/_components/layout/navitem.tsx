import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    List,
    ListItem,
    ListItemProps,
    Tooltip,
    Typography,
} from "@mui/material";
import { map } from "lodash";
import React, { useMemo, useState } from "react";
import { useMatch, useNavigate } from "react-router-dom";
import { theme } from "theme";

export type SingleNavItemT = {
    href: string;
    icon: React.ReactNode;
    title: string;
    exact?: boolean;
    listProps?: ListItemProps;
    subItem?: boolean;
    params?: string;
    onSidebarClose?: () => void;
    external?: boolean;
};

export type NavItemT = SingleNavItemT & {
    subItems?: SingleNavItemT[];
};

type MenuElementPropsT = {
    title: string;
    icon: React.ReactNode;
    href?: string;
    params?: string;
    active: boolean;
    onClick: (e: React.MouseEvent) => void;
    children?: React.ReactNode;
    pl?: number;
};

const MenuElement: React.FC<MenuElementPropsT> = ({
    icon,
    title,
    href,
    params,
    onClick,
    active,
    children,
    pl,
}) => (
    <Box
        width="100%"
        pl={pl}
        sx={{
            "&:hover": {
                backgroundColor: "rgba(255,255,255, 0.08)",
            },
        }}
    >
        <Button
            component="a"
            href={params ? `${href}?${params}` : href}
            sx={{
                borderRadius: 1,
                color: active ? "secondary.main" : "neutral.300",
                justifyContent: "flex-start",
                textAlign: "left",
                textTransform: "none",
                width: "100%",
                "& .MuiButton-startIcon": {
                    color: active ? "secondary.main" : "neutral.400",
                },
            }}
            startIcon={icon}
            onClick={onClick}
            disableRipple
        >
            <Box width="100%" display="flex" justifyContent="space-between">
                <Typography fontWeight={500} fontSize={15} height={20}>
                    {title}
                </Typography>
                {children}
            </Box>
        </Button>
    </Box>
);

export const NavItem: React.FC<SingleNavItemT> = ({
    href,
    icon,
    title,
    exact = false,
    listProps,
    subItem,
    params,
    onSidebarClose,
    external = false,
}) => {
    const navigate = useNavigate();
    const match = useMatch(`${href}/*`);
    const employeesMatch = useMatch("employees/*"); // temporary

    const active = exact
        ? match?.pathname === href
        : !!match || (!!employeesMatch && href === "/people");

    const onClick = (e: React.MouseEvent) => {
        e.preventDefault();

        if (href.startsWith("https://") || external) {
            window.location.href = href;
        } else {
            onSidebarClose && onSidebarClose();
            navigate(
                params
                    ? {
                          pathname: href,
                          search: params,
                      }
                    : href,
            );
        }
    };

    return (
        <ListItem
            disableGutters
            sx={{
                py: 0,
                ...(subItem
                    ? {
                          "&:before": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              bottom: 0,
                              width: 2,
                              backgroundColor:
                                  theme.palette.primary.contrastText,
                          },
                      }
                    : {}),
            }}
            {...listProps}
        >
            <MenuElement
                title={title}
                icon={icon}
                href={href}
                params={params}
                active={active}
                onClick={onClick}
                pl={subItem ? 2 : 0.5}
            />
        </ListItem>
    );
};

export const FordableNavItem: React.FC<NavItemT> = ({
    href,
    icon,
    title,
    exact = false,
    listProps,
    subItems,
    onSidebarClose,
}) => {
    const match = useMatch(href);
    const active = exact ? match?.pathname === href : !!match;

    const [expanded, setExpanded] = useState<boolean>(active);

    const accordionItems = useMemo(
        () =>
            map(subItems, ({ title, icon, listProps, exact, ...item }) => (
                <NavItem
                    key={title}
                    {...{
                        title,
                        href: `${href}/${item.href}`,
                        icon,
                        listProps,
                        exact,
                    }}
                    subItem
                    onSidebarClose={onSidebarClose}
                />
            )),
        [subItems, href, onSidebarClose],
    );
    return (
        <ListItem
            sx={{
                p: 0,
                mb: 0.5,
            }}
            {...listProps}
            disableGutters
        >
            <Accordion
                sx={{
                    m: 0,
                    backgroundColor: "inherit",
                    color: "inherit",
                    width: "100%",
                }}
                expanded={expanded}
                disableGutters
            >
                <AccordionSummary
                    sx={{
                        p: 0,
                        minHeight: 0,
                        "& > .MuiAccordionSummary-content": {
                            margin: 0,
                        },
                    }}
                >
                    <MenuElement
                        title={title}
                        icon={icon}
                        active={active}
                        onClick={() => setExpanded(!expanded)}
                        pl={0.5}
                    >
                        <Tooltip
                            title={`${expanded ? "collapse" : "expand"} area`}
                        >
                            <ExpandMoreIcon
                                fontSize="small"
                                sx={{
                                    transform: expanded
                                        ? "rotate(180deg)"
                                        : "none",
                                }}
                            />
                        </Tooltip>
                    </MenuElement>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 0 }}>
                    <List sx={{ p: 0 }}>{accordionItems}</List>
                </AccordionDetails>
            </Accordion>
        </ListItem>
    );
};
