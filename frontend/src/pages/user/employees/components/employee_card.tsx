import ChatIcon from "@mui/icons-material/Chat";
import EmailIcon from "@mui/icons-material/Email";
import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Typography,
} from "@mui/material";
import { pararamChatURL } from "config";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { EmployeeT } from "types";
import { avatarUrl } from "utils/url";

interface IEmployeeCardProps {
    employee: EmployeeT;
}

const EmployeeCard: FC<IEmployeeCardProps> = ({ employee }) => {
    const navigate = useNavigate();

    return (
        <Card
            sx={{
                width: "calc(25% - 12px)",
            }}
            elevation={16}
        >
            <CardActionArea onClick={() => navigate(`view/${employee.id}`)}>
                <Box
                    sx={{
                        position: "relative",
                        overflow: "hidden",
                        height: "200px",
                        "& img": {
                            width: "100%",
                            height: "100%",
                            position: "absolute",
                        },
                    }}
                >
                    <img
                        style={{
                            objectFit: "cover",
                            filter: "blur(4px) brightness(80%)",
                            transform: "scale(1.1)",
                        }}
                        src={avatarUrl(employee.id, 400)}
                        alt={employee.english_name}
                    />
                    <img
                        style={{
                            objectFit: "contain",
                        }}
                        src={avatarUrl(employee.id, 400)}
                        alt={employee.english_name}
                    />
                </Box>
            </CardActionArea>

            <CardContent sx={{ bgcolor: "background.default" }}>
                <Typography fontWeight={500} fontSize={20}>
                    {employee.english_name}
                </Typography>

                <Box display="flex" alignItems="center" gap="4px">
                    <EmailIcon fontSize="small" color="info" />
                    <a href={`mailto:${employee.email}`}>{employee.email}</a>
                </Box>

                {employee.pararam && (
                    <Box display="flex" alignItems="center" gap="4px">
                        <ChatIcon fontSize="small" color="info" />
                        <a
                            href={pararamChatURL + employee.pararam}
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            @{employee.pararam}
                        </a>
                    </Box>
                )}

                <Typography>
                    Position: {employee.position?.label || "---"}
                </Typography>

                <Typography>Team: {employee.team?.label || "---"}</Typography>

                {employee.team_position && (
                    <Typography>Team role: {employee.team_position}</Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default EmployeeCard;
