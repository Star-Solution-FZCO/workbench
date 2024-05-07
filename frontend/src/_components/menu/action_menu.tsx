import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Box,
    Button,
    ClickAwayListener,
    IconButton,
    Menu,
    MenuProps,
    Tooltip,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import React, { useCallback, useState } from "react";

const StyledMenu = styled((props: MenuProps) => (
    <Menu
        elevation={0}
        anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
        }}
        transformOrigin={{
            vertical: "top",
            horizontal: "right",
        }}
        {...props}
    />
))(({ theme }) => ({
    "& .MuiPaper-root": {
        borderRadius: 6,
        marginTop: theme.spacing(1),
        minWidth: 180,
        color:
            theme.palette.mode === "light"
                ? "rgb(55, 65, 81)"
                : theme.palette.grey[300],
        boxShadow:
            "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
        "& .MuiMenu-list": {
            padding: "4px 0",
        },
        "& .MuiMenuItem-root": {
            "& .MuiSvgIcon-root": {
                fontSize: 18,
                color: theme.palette.text.secondary,
                marginRight: theme.spacing(1.5),
            },
            "&:active": {
                backgroundColor: alpha(
                    theme.palette.primary.main,
                    theme.palette.action.selectedOpacity,
                ),
            },
        },
    },
}));

type MenuStateT = {
    filterFieldOpen: boolean;
    anchorEl: HTMLElement | null;
};

const initialState: MenuStateT = {
    filterFieldOpen: false,
    anchorEl: null,
};

type ActionMenuPropsT = React.PropsWithChildren & {
    tooltipText: string;
    renderButton: (
        onClick: (event: React.MouseEvent<HTMLElement>) => void,
        isOpen: boolean,
    ) => React.ReactElement;
};
export const ActionMenu: React.FC<ActionMenuPropsT> = ({
    renderButton,
    children,
    tooltipText,
}) => {
    const [state, setState] = useState<MenuStateT>(initialState);
    const handleClick = useCallback(
        (name: keyof MenuStateT) => (event: React.MouseEvent<HTMLElement>) => {
            setState({ ...state, [name]: true, anchorEl: event.currentTarget });
        },
        [state],
    );
    const handleClose = useCallback(
        (name: keyof MenuStateT) => () => {
            setState({ ...state, [name]: false, anchorEl: null });
        },
        [state],
    );

    return (
        <Box display="flex">
            <Tooltip title={tooltipText}>
                {renderButton(
                    handleClick("filterFieldOpen"),
                    initialState.filterFieldOpen,
                )}
            </Tooltip>
            <StyledMenu
                anchorEl={state.anchorEl}
                open={state.filterFieldOpen}
                onClose={handleClose}
                disableEscapeKeyDown={false}
            >
                <div>
                    <ClickAwayListener
                        onClickAway={handleClose("filterFieldOpen")}
                    >
                        <div>{children}</div>
                    </ClickAwayListener>
                </div>
            </StyledMenu>
        </Box>
    );
};

export const ActionButtonMenu: React.FC<
    React.PropsWithChildren & { buttonText: string; tooltipText: string }
> = ({ buttonText, children, tooltipText }) => {
    const renderButton = useCallback(
        (
            onClick: (event: React.MouseEvent<HTMLElement>) => void,
            isOpen: boolean,
        ) => (
            <Button
                variant="text"
                endIcon={<ExpandMoreIcon />}
                aria-controls={isOpen ? "filter-fields-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={isOpen ? "true" : undefined}
                onClick={onClick}
            >
                {buttonText}
            </Button>
        ),
        [buttonText],
    );

    return (
        <ActionMenu tooltipText={tooltipText} renderButton={renderButton}>
            {children}
        </ActionMenu>
    );
};

export const ActionIconMenu: React.FC<
    React.PropsWithChildren & { icon: React.ReactNode; tooltipText: string }
> = ({ icon, children, tooltipText }) => {
    const renderButton = useCallback(
        (
            onClick: (event: React.MouseEvent<HTMLElement>) => void,
            isOpen: boolean,
        ) => (
            <IconButton
                aria-controls={isOpen ? "filter-fields-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={isOpen ? "true" : undefined}
                onClick={onClick}
            >
                {icon}
            </IconButton>
        ),
        [icon],
    );

    return (
        <ActionMenu tooltipText={tooltipText} renderButton={renderButton}>
            {children}
        </ActionMenu>
    );
};
