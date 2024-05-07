import ClearIcon from "@mui/icons-material/Clear";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneIcon from "@mui/icons-material/Done";
import EditIcon from "@mui/icons-material/Edit";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import HistoryIcon from "@mui/icons-material/History";
import InputIcon from "@mui/icons-material/Input";
import OutputIcon from "@mui/icons-material/Output";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import PreviewIcon from "@mui/icons-material/Preview";
import {
    IconButton,
    IconButtonProps,
    SvgIconProps,
    Tooltip,
    TooltipProps,
} from "@mui/material";
import React from "react";
import { theme } from "theme";

type BaseIconButton = {
    onClick: (event: React.MouseEvent) => void;
    buttonProps?: IconButtonProps;
    iconProps?: SvgIconProps;
    hoverColor?: string;
};
type ToolTipPropsT = {
    tooltip?: string;
    tooltipProps?: TooltipProps;
};
type IconDefinedButtonT = BaseIconButton & ToolTipPropsT;
type HoverIconButtonPropsT = BaseIconButton & {
    ButtonIcon: React.ElementType;
};
export const HoverIconButton: React.FC<HoverIconButtonPropsT> = ({
    onClick,
    buttonProps,
    iconProps,
    hoverColor,
    ButtonIcon,
}) => (
    <IconButton
        disableRipple
        sx={{ px: 0, mr: 0.5, "&:hover": { color: hoverColor } }}
        size="small"
        {...buttonProps}
        onClick={onClick}
    >
        <ButtonIcon fontSize="small" {...iconProps} />
    </IconButton>
);
type TooltipButtonPropsT = HoverIconButtonPropsT & ToolTipPropsT;
export const TooltipHoverIconButtonButton: React.FC<TooltipButtonPropsT> = ({
    tooltip = "",
    tooltipProps,
    hoverColor,
    buttonProps,
    onClick,
    ButtonIcon,
    iconProps,
}) => (
    <Tooltip {...tooltipProps} title={tooltip}>
        <IconButton
            disableRipple
            sx={{ px: 0, "&:hover": { color: hoverColor } }}
            size="small"
            {...buttonProps}
            onClick={onClick}
        >
            <ButtonIcon fontSize="small" {...iconProps} />
        </IconButton>
    </Tooltip>
);

export const ErrorTooltipHoverIconButtonButton: React.FC<
    TooltipButtonPropsT
> = ({ ...props }) => (
    <TooltipHoverIconButtonButton
        hoverColor={theme.palette.error.light}
        {...props}
    />
);
export const SuccessTooltipHoverIconButtonButton: React.FC<
    TooltipButtonPropsT
> = ({ ...props }) => (
    <TooltipHoverIconButtonButton
        hoverColor={theme.palette.success.light}
        {...props}
    />
);
export const WarningTooltipHoverIconButtonButton: React.FC<
    TooltipButtonPropsT
> = ({ ...props }) => (
    <TooltipHoverIconButtonButton
        hoverColor={theme.palette.warning.light}
        {...props}
    />
);
export const InfoTooltipHoverIconButtonButton: React.FC<
    TooltipButtonPropsT
> = ({ ...props }) => (
    <TooltipHoverIconButtonButton
        hoverColor={theme.palette.info.light}
        {...props}
    />
);
export const PrimaryTooltipHoverIconButtonButton: React.FC<
    TooltipButtonPropsT
> = ({ ...props }) => (
    <TooltipHoverIconButtonButton
        hoverColor={theme.palette.primary.light}
        {...props}
    />
);
export const SecondaryTooltipHoverIconButtonButton: React.FC<
    TooltipButtonPropsT
> = ({ ...props }) => (
    <TooltipHoverIconButtonButton
        hoverColor={theme.palette.secondary.light}
        {...props}
    />
);
export const ClearButton: React.FC<
    IconDefinedButtonT & { tooltip?: string }
> = ({ tooltip = "Clear item", ...props }) => (
    <ErrorTooltipHoverIconButtonButton
        tooltip={tooltip}
        {...props}
        ButtonIcon={ClearIcon}
    />
);
export const ViewButton: React.FC<IconDefinedButtonT> = ({
    tooltip = "View item",
    ...props
}) => (
    <PrimaryTooltipHoverIconButtonButton
        tooltip={tooltip}
        {...props}
        ButtonIcon={PreviewIcon}
    />
);
export const EditButton: React.FC<IconDefinedButtonT> = ({
    tooltip = "Edit item",
    ...props
}) => (
    <InfoTooltipHoverIconButtonButton
        tooltip={tooltip}
        {...props}
        ButtonIcon={EditIcon}
    />
);
export const DeleteButton: React.FC<IconDefinedButtonT> = ({
    tooltip = "Delete item",
    ...props
}) => (
    <ErrorTooltipHoverIconButtonButton
        tooltip={tooltip}
        {...props}
        ButtonIcon={DeleteIcon}
    />
);

export const DismissalButton: React.FC<IconDefinedButtonT> = ({
    tooltip = "Dismiss",
    ...props
}) => (
    <ErrorTooltipHoverIconButtonButton
        tooltip={tooltip}
        {...props}
        ButtonIcon={PersonOffIcon}
    />
);

export const JoinButton: React.FC<IconDefinedButtonT> = ({
    tooltip = "Join",
    ...props
}) => (
    <SuccessTooltipHoverIconButtonButton
        tooltip={tooltip}
        {...props}
        ButtonIcon={InputIcon}
    />
);

export const LeaveButton: React.FC<IconDefinedButtonT> = ({
    tooltip = "Leave",
    ...props
}) => (
    <ErrorTooltipHoverIconButtonButton
        tooltip={tooltip}
        {...props}
        ButtonIcon={OutputIcon}
    />
);

export const InviteButton: React.FC<IconDefinedButtonT> = ({
    tooltip = "Invite",
    ...props
}) => (
    <SuccessTooltipHoverIconButtonButton
        tooltip={tooltip}
        {...props}
        ButtonIcon={PersonAddIcon}
    />
);

export const ApproveButton: React.FC<IconDefinedButtonT> = ({
    tooltip = "Approve",
    ...props
}) => (
    <SuccessTooltipHoverIconButtonButton
        tooltip={tooltip}
        {...props}
        ButtonIcon={DoneIcon}
    />
);

export const HistoryButton: React.FC<IconDefinedButtonT> = ({
    tooltip = "History",
    ...props
}) => (
    <InfoTooltipHoverIconButtonButton
        tooltip={tooltip}
        {...props}
        ButtonIcon={HistoryIcon}
    />
);

export const AddGroupButton: React.FC<IconDefinedButtonT> = ({
    tooltip = "Add group",
    ...props
}) => (
    <InfoTooltipHoverIconButtonButton
        tooltip={tooltip}
        {...props}
        ButtonIcon={GroupAddIcon}
    />
);
