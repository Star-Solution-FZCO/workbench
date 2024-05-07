import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import BlockIcon from "@mui/icons-material/Block";
import LuggageIcon from "@mui/icons-material/Luggage";
import SickIcon from "@mui/icons-material/Sick";
import WeekendIcon from "@mui/icons-material/Weekend";
import WorkIcon from "@mui/icons-material/Work";
import {
    IconButton,
    SvgIconTypeMap,
    Tooltip,
    TooltipProps,
    Typography,
    styled,
    tooltipClasses,
} from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { dayTypeLabels } from "_components/calendar/calendar/utils";
import { dayBackgroundStyleMap } from "config";
import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import { DayT } from "types";

const iconMap: Record<
    DayT,
    OverridableComponent<SvgIconTypeMap> & { muiName: string }
> = {
    working_day: WorkIcon,
    weekend: WeekendIcon,
    holiday: WeekendIcon,
    sick_day: SickIcon,
    working_day_personal_schedule: WorkIcon,
    weekend_personal_schedule: WeekendIcon,
    vacation: BeachAccessIcon,
    unpaid_leave: WeekendIcon,
    business_trip: LuggageIcon,
    day_before_employment: WeekendIcon,
    day_after_dismissal: BlockIcon,
};

const getIcon = (dayType: DayT, onClick: (event: React.MouseEvent) => void) => {
    const Icon = iconMap[dayType];

    return (
        <IconButton onClick={onClick} sx={{ p: 0 }}>
            <Icon
                sx={{
                    color:
                        dayType !== "working_day"
                            ? dayBackgroundStyleMap[dayType]
                            : "grey",
                }}
            />
        </IconButton>
    );
};

const getTitle = (day_type: DayT) => {
    const day_type_label = dayTypeLabels.filter(
        (rec) => rec.type === day_type,
    )[0].label;

    return (
        <Typography fontSize={12} textAlign="center">
            <strong>{day_type_label}</strong>
            <br />
            This information is provided by the person's schedule. This is not a
            real (online) status.
        </Typography>
    );
};

const CustomTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
))({
    [`& .${tooltipClasses.tooltip}`]: {
        maxWidth: 270,
    },
});

interface DayTypeIconProps {
    id: number;
    dayType: DayT;
}

const DayTypeIconButton: FC<DayTypeIconProps> = ({ id, dayType }) => {
    const navigate = useNavigate();

    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        navigate(`/people/view/${id}/calendar`);
    };

    return (
        <CustomTooltip title={getTitle(dayType)} placement="top">
            {getIcon(dayType, handleClick)}
        </CustomTooltip>
    );
};

export default DayTypeIconButton;
