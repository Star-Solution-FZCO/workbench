import {
    Avatar,
    Box,
    Popover,
    Skeleton,
    SxProps,
    Typography,
    useTheme,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { employeesApi, useAppSelector } from "_redux";
import { pararamChatURL } from "config";
import React, { FC, useRef, useState } from "react";
import LinesEllipsis from "react-lines-ellipsis";
import { useNavigate } from "react-router-dom";
import { EmployeeT, UserInfoT } from "types/models";
import { avatarUrl, storageUrl } from "utils/url";
import { EmployeeDoneTaskScore } from "../employee_score.tsx";

type EmployeeAvatarPropsT = {
    id: number;
    label: string;
    size?: number;
    fontSize?: number;
    sx?: SxProps;
    onClick?: () => void;
};

export const EmployeeAvatar: FC<EmployeeAvatarPropsT> = ({
    id,
    label,
    size = 20,
    fontSize = 12,
    sx,
    onClick = () => {},
}) => {
    const profile = useAppSelector(({ profile }) => profile.payload);

    return (
        <Avatar
            alt={label}
            sx={{
                width: size,
                height: size,
                fontSize: fontSize,
                ...sx,
            }}
            src={
                profile.id != id
                    ? avatarUrl(id, 100)
                    : storageUrl(profile.photo)
            }
            onClick={onClick}
        >
            {label.split(" ").map((i) => i.charAt(0))}
        </Avatar>
    );
};

type EmployeeAvatarInteractivePropsT = {
    employee: UserInfoT;
    size?: number;
    fontSize?: number;
    sx?: SxProps;
};

const useEmployeeAvatarInteractiveStyles = makeStyles({
    popover: {
        pointerEvents: "none",
    },
    popoverContent: {
        pointerEvents: "auto",
    },
});

export const EmployeeAvatarInteractive: FC<EmployeeAvatarInteractivePropsT> = ({
    employee,
    size = 20,
    fontSize = 10,
    sx,
}) => {
    const theme = useTheme();
    const navigate = useNavigate();

    const profile = useAppSelector(({ profile }) => profile.payload);

    const classes = useEmployeeAvatarInteractiveStyles();

    const [getInfo] = employeesApi.useLazyGetEmployeeQuery();

    const [popoverOpen, setPopoverOpen] = useState(false);
    const [data, setData] = useState<EmployeeT>();
    const [useEllipsis, setUseEllipsis] = useState(true);

    const popoverAnchor = useRef(null);

    const handlePopoverOpen = () => {
        getInfo({ id: employee.id }, true)
            .unwrap()
            .then((response) => {
                setData(response.payload);
            });
        setPopoverOpen(true);
    };

    const handlePopoverClose = () => {
        setPopoverOpen(false);
    };

    const renderEmployeeInfo = () => {
        if (!data)
            return (
                <Box
                    display="flex"
                    flexDirection="column"
                    sx={{ gap: "8px", padding: "32px", width: "300px" }}
                >
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap="4px"
                    >
                        <Skeleton variant="circular" width={96} height={96} />

                        <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                        >
                            <Typography fontSize={18} fontWeight="bold">
                                <Skeleton width={200} />
                            </Typography>

                            <Typography fontSize={18}>
                                <Skeleton width={200} />
                            </Typography>
                        </Box>
                    </Box>

                    <Box display="flex" flexDirection="column" gap="4px">
                        {[...Array(6)].map((_, index) => (
                            <Typography key={index}>
                                <Skeleton variant="rectangular" />
                            </Typography>
                        ))}
                    </Box>
                </Box>
            );

        return (
            <Box
                display="flex"
                flexDirection="column"
                sx={{ gap: "8px", padding: 3, width: "320px" }}
            >
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap="4px"
                >
                    <Avatar
                        sx={{
                            width: 96,
                            height: 96,
                            fontSize: 36,
                        }}
                        src={
                            profile.id != employee.id
                                ? avatarUrl(employee.id, 200)
                                : storageUrl(profile.photo)
                        }
                    >
                        {employee.english_name
                            .split(" ")
                            .map((i) => i.charAt(0))}
                    </Avatar>

                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                    >
                        <Typography fontSize={18} fontWeight="bold">
                            {data.english_name}
                        </Typography>

                        <Typography fontSize={18}>
                            {data.native_name}
                        </Typography>
                    </Box>
                </Box>

                <Box>
                    <EmployeeDoneTaskScore employeeId={employee.id} />
                </Box>

                <Box display="flex" flexDirection="column" gap="4px">
                    <Typography>
                        E-Mail:{" "}
                        <a href={`mailto:${data.email}`}>{data.email}</a>
                    </Typography>

                    <Typography>
                        Pararam:{" "}
                        {data.pararam ? (
                            <a
                                href={pararamChatURL + data.pararam}
                                target="_blank"
                                rel="noreferrer noopener"
                            >
                                @{data.pararam}
                            </a>
                        ) : (
                            "---"
                        )}
                    </Typography>

                    <Typography>
                        Position: {data.position?.label || "---"}
                    </Typography>

                    <Typography>Team: {data.team?.label || "---"}</Typography>
                    <Typography>
                        Team role: {data.team_position || "---"}
                    </Typography>

                    <Box
                        display="flex"
                        gap="4px"
                        sx={{
                            "& p": {
                                display: "inline",
                            },
                            "& span": {
                                color: theme.palette.info.dark,
                                cursor: "pointer",
                            },
                        }}
                        onClick={() => setUseEllipsis(!useEllipsis)}
                    >
                        <Box>Projects: </Box>
                        <Box>
                            {useEllipsis ? (
                                <LinesEllipsis
                                    text={
                                        data.projects.length > 0
                                            ? data.projects.join(", ")
                                            : "---"
                                    }
                                    maxLine="2"
                                    ellipsis=" ...show more"
                                    trimRight
                                    basedOn="words"
                                    component="p"
                                />
                            ) : data.projects.length > 0 ? (
                                data.projects.join(", ")
                            ) : (
                                "---"
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        );
    };

    return (
        <>
            <Avatar
                ref={popoverAnchor}
                sx={{
                    width: size,
                    height: size,
                    fontSize,
                    cursor: "pointer",
                    ...sx,
                }}
                src={
                    profile.id != employee.id
                        ? avatarUrl(employee.id, 100)
                        : storageUrl(profile.photo)
                }
                onClick={() => {
                    navigate(`/people/view/${employee.id}`);
                }}
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}
            >
                {employee.english_name.split(" ").map((i) => i.charAt(0))}
            </Avatar>

            <Popover
                className={classes.popover}
                classes={{
                    paper: classes.popoverContent,
                }}
                open={popoverOpen}
                anchorEl={popoverAnchor.current}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                disableRestoreFocus
                PaperProps={{
                    onMouseEnter: handlePopoverOpen,
                    onMouseLeave: handlePopoverClose,
                }}
                elevation={8}
            >
                {renderEmployeeInfo()}
            </Popover>
        </>
    );
};

type ManagerViewPropsT = {
    id: number;
    label: string;
    pararam?: string | null;
    size?: number;
};

export const ManagerView: React.FC<ManagerViewPropsT> = ({
    label,
    id,
    pararam,
    size,
}) => (
    <Box display="flex" alignItems="center" height="100%" gap={1}>
        <EmployeeAvatar id={id} label={label} size={size} />
        <Typography fontSize={16}>
            {label} {pararam && `(@${pararam})`}
        </Typography>
    </Box>
);
