import AccountTreeIcon from "@mui/icons-material/AccountTree";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import SourceIcon from "@mui/icons-material/Source";
import SummarizeIcon from "@mui/icons-material/Summarize";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
    Badge,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Tooltip,
    Typography,
} from "@mui/material";
import { AvatarField, Modal } from "_components";
import ActivitySourceAliasesList from "_components/activity_source_aliases_list";
import { DismissSubmitDialog } from "_components/dismiss";
import WatchModal from "_components/watch_modal";
import { employeesApi, useAppSelector } from "_redux";
import { AUTH_MODE, today, weekAgo } from "config";
import { endOfWeek, format, startOfWeek } from "date-fns";
import React, { FC, useState } from "react";
import { createSearchParams, useMatch, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ApiResponse, EmployeeT } from "types";
import { toastError } from "utils";
import { storageUrl } from "utils/url";
import { DismissalButton } from "./buttons";
import { EmployeeOrgStructure } from "./employee_org_structure";
import { EmployeeAvatar } from "./views/manager";

const start = format(
    startOfWeek(weekAgo(), {
        weekStartsOn: 1,
    }),
    "yyyy-MM-dd",
);
const end = format(
    endOfWeek(today(), {
        weekStartsOn: 1,
    }),
    "yyyy-MM-dd",
);

const UserInfo: FC<{
    data: ApiResponse<EmployeeT>;
    hideControls?: boolean;
}> = ({ data: responseData, hideControls }) => {
    const navigate = useNavigate();

    const { payload: data } = responseData;

    const isProfilePage = useMatch("/profile/*");
    const isLocalAuth = AUTH_MODE === "local";

    const [openDismissEmployeeWindow, setOpenDismissEmployeeWindow] =
        useState(false);
    const [openWatchEmployeeModal, setOpenWatchEmployeeModal] = useState(false);
    const [openPhotoEdit, setOpenPhotoEdit] = useState(false);

    const [openActivitySourceAliasList, setOpenActivitySourceAliasList] =
        useState(false);
    const [openOrgStructure, setOpenOrgStructure] = useState(false);

    const [userSettingsMenuAnchorEl, setUserSettingsMenuAnchorEl] =
        useState<HTMLElement | null>(null);
    const [registerUser] = employeesApi.useRegisterEmployeeMutation();
    const [deleteUserRegistration] =
        employeesApi.useDeleteEmployeeRegistrationMutation();

    const profile = useAppSelector(({ profile }) => profile.payload);

    const hasAccessToDismiss = [
        "hr",
        "recruiter",
        "admin",
        "super_hr",
        "super_admin",
    ].some((role) => profile.roles?.includes(role));

    const handleClickGoToReports = () => {
        const params = {
            id: data.id.toString(),
            start,
            end,
        };

        navigate({
            pathname: "/reports/activity-summary",
            search: createSearchParams(params).toString(),
        });
    };

    const handleUserSettingsMenuOpen = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        setUserSettingsMenuAnchorEl(event.currentTarget);
    };

    const handleUserSettingsMenuClose = () => {
        setUserSettingsMenuAnchorEl(null);
    };

    const handleRegister = () => {
        registerUser(data.id)
            .unwrap()
            .then(() => {
                toast.success("Registration token has been sent to the user");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleDeleteUserRegistration = () => {
        deleteUserRegistration(data.id)
            .unwrap()
            .then(() => {
                toast.success("User registration has been deleted");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <>
            <Modal
                open={openDismissEmployeeWindow}
                onClose={() => setOpenDismissEmployeeWindow(false)}
            >
                <DismissSubmitDialog
                    id={data.id}
                    onClose={() => setOpenDismissEmployeeWindow(false)}
                />
            </Modal>

            <WatchModal
                open={openWatchEmployeeModal}
                onClose={() => setOpenWatchEmployeeModal(false)}
                employee={data}
            />

            <Modal open={openPhotoEdit} onClose={() => setOpenPhotoEdit(false)}>
                <AvatarField
                    userId={data.id}
                    imageURL={storageUrl(data.photo)}
                    onModalClose={() => setOpenPhotoEdit(false)}
                />
            </Modal>

            <Modal
                open={openActivitySourceAliasList}
                onClose={() => {
                    setOpenActivitySourceAliasList(false);
                }}
            >
                <ActivitySourceAliasesList id={data.id} />
            </Modal>

            <Modal
                open={openOrgStructure}
                onClose={() => setOpenOrgStructure(false)}
            >
                <EmployeeOrgStructure employee={data} />
            </Modal>

            <Box display="flex" flexDirection="row" alignItems="center" gap={2}>
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    badgeContent={
                        !hideControls &&
                        profile.id === data.id && (
                            <IconButton
                                sx={{
                                    background: "#FFFFFF",
                                    border: "2px solid #CCCCCC",
                                    width: "32px",
                                    height: "32px",
                                    "&:hover": {
                                        background: "#FFFFFF",
                                    },
                                }}
                                onClick={() => setOpenPhotoEdit(true)}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        )
                    }
                >
                    <EmployeeAvatar
                        id={data.id}
                        label={data.english_name}
                        size={96}
                        fontSize={36}
                    />
                </Badge>

                <Typography variant={"h5"}>{data.english_name}</Typography>

                {!hideControls && (
                    <Box display="flex" gap="8px">
                        {!isProfilePage && data.active && (
                            <Tooltip
                                title={
                                    data.is_current_user_watch
                                        ? "Unwatch"
                                        : "Watch"
                                }
                            >
                                <IconButton
                                    sx={{
                                        p: 0,
                                        "&:hover": {
                                            color: "info.main",
                                        },
                                    }}
                                    size="small"
                                    onClick={() =>
                                        setOpenWatchEmployeeModal(true)
                                    }
                                    disableRipple
                                >
                                    {data.is_current_user_watch ? (
                                        <VisibilityOffIcon />
                                    ) : (
                                        <VisibilityIcon />
                                    )}
                                </IconButton>
                            </Tooltip>
                        )}

                        {hasAccessToDismiss && data.active && (
                            <DismissalButton
                                onClick={() =>
                                    setOpenDismissEmployeeWindow(true)
                                }
                            />
                        )}

                        {(profile.admin || profile.hr) && (
                            <Tooltip title="Show aliases in activity sources">
                                <IconButton
                                    sx={{
                                        p: 0,
                                        "&:hover": {
                                            color: "secondary.main",
                                        },
                                    }}
                                    onClick={() =>
                                        setOpenActivitySourceAliasList(true)
                                    }
                                    size="small"
                                    disableRipple
                                >
                                    <SourceIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {!isProfilePage && (
                            <Tooltip title="Reports">
                                <IconButton
                                    sx={{
                                        p: 0,
                                        "&:hover": {
                                            color: "info.main",
                                        },
                                    }}
                                    onClick={handleClickGoToReports}
                                    size="small"
                                    disableRipple
                                >
                                    <SummarizeIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="Organizational structure">
                            <IconButton
                                sx={{
                                    p: 0,
                                    "&:hover": {
                                        color: "warning.main",
                                    },
                                }}
                                onClick={() => setOpenOrgStructure(true)}
                                size="small"
                                disableRipple
                            >
                                <AccountTreeIcon />
                            </IconButton>
                        </Tooltip>

                        {profile.admin && isLocalAuth && (
                            <>
                                <Tooltip title="Register user">
                                    <IconButton
                                        sx={{
                                            p: 0,
                                            "&:hover": {
                                                color: "secondary.main",
                                            },
                                        }}
                                        onClick={handleUserSettingsMenuOpen}
                                        size="small"
                                        disableRipple
                                    >
                                        <SettingsIcon />
                                    </IconButton>
                                </Tooltip>
                                <Menu
                                    open={Boolean(userSettingsMenuAnchorEl)}
                                    onClose={handleUserSettingsMenuClose}
                                    anchorEl={userSettingsMenuAnchorEl}
                                >
                                    <MenuItem onClick={handleRegister}>
                                        Register user
                                    </MenuItem>
                                    <MenuItem
                                        onClick={handleDeleteUserRegistration}
                                    >
                                        Delete user registration
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Box>
                )}
            </Box>
        </>
    );
};

export { UserInfo };
