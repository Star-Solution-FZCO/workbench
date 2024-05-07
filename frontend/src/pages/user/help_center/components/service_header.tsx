import SettingsIcon from "@mui/icons-material/Settings";
import { Box, Button, Link as MuiLink, Typography } from "@mui/material";
import { useAppSelector } from "_redux";
import { YOUTRACK_URL } from "config";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { ServiceT } from "types";
import { Link } from "./link";

interface IServiceHeaderProps {
    service: ServiceT;
    title?: string;
    requestId?: string;
}

const ServiceHeader: FC<IServiceHeaderProps> = ({
    service,
    title,
    requestId,
}) => {
    const navigate = useNavigate();

    const profile = useAppSelector((state) => state.profile.payload);
    const canEdit = profile.admin || profile.hr;

    return (
        <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
        >
            <Box display="flex" gap={1}>
                <Box
                    sx={{
                        "& img": {
                            width: "64px",
                            height: "64px",
                            objectFit: "contain",
                        },
                    }}
                >
                    <img src={service.icon} alt={service.group.portal.name} />
                </Box>

                <Box display="flex" flexDirection="column">
                    <Box display="flex" gap={1}>
                        <Link to="/help-center">Help Center</Link>/
                        <Link
                            to={`/help-center/portal/${service.group.portal.id}`}
                        >
                            {service.group.portal.name}
                        </Link>
                        {requestId && (
                            <>
                                /
                                <MuiLink
                                    sx={{
                                        color: "#0052cc",
                                        textDecoration: "none",
                                        fontWeight: 500,
                                        "&:hover": {
                                            textDecoration: "underline",
                                        },
                                    }}
                                    href={YOUTRACK_URL + "/issue/" + requestId}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {requestId}
                                </MuiLink>
                            </>
                        )}
                    </Box>
                    <Typography fontSize={20} fontWeight={700}>
                        {title || service.name}
                    </Typography>
                </Box>
            </Box>

            {canEdit && (
                <Button
                    onClick={() =>
                        navigate(`/help-center/services/edit/${service.id}`)
                    }
                    variant="outlined"
                    color="secondary"
                    size="small"
                    endIcon={<SettingsIcon />}
                >
                    Edit service
                </Button>
            )}
        </Box>
    );
};

export { ServiceHeader };
