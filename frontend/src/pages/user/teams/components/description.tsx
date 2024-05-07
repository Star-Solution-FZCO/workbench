import ArchiveIcon from "@mui/icons-material/Archive";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import RestoreIcon from "@mui/icons-material/Restore";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { Box, Button, Chip, Tooltip, Typography } from "@mui/material";
import { EditButton, Employee, Modal, ParsedHTMLContent } from "_components";
import { employeesApi, useAppSelector } from "_redux";
import { monthAgo, today } from "config";
import { format } from "date-fns";
import { FC, useState } from "react";
import { Link, createSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { SelectTagOptionT, TeamT } from "types";
import { toastError } from "utils";
import { EditTeamForm } from "../form";
import { TeamJoinRequestDialog } from "../joinRequest";
import { TeamTag } from "./tag";

interface ITeamDescriptionProps {
    team: TeamT;
}

const TeamDescription: FC<ITeamDescriptionProps> = ({ team }) => {
    const navigate = useNavigate();

    const profile = useAppSelector(({ profile }) => profile.payload);

    const [editTeamOpen, setEditTeamOpen] = useState(false);
    const [joinTeamOpen, setJoinTeamOpen] = useState(false);

    const [archiveTeam] = employeesApi.useArchiveTeamMutation();
    const [restoreTeam] = employeesApi.useRestoreTeamMutation();

    const goToTeamReports = () => {
        const params = {
            team: team.id.toString(),
            start: format(monthAgo(), "yyyy-MM-dd"),
            end: format(today(), "yyyy-MM-dd"),
        };

        navigate({
            pathname: "/reports/activity-summary",
            search: createSearchParams(params).toString(),
        });
    };

    const handleArchiveTeam = () => {
        archiveTeam(team.id)
            .unwrap()
            .then(() => {
                toast.success("Team archived successfully");
            })
            .catch((error) => toastError(error));
    };

    const handleRestoreTeam = () => {
        restoreTeam(team.id)
            .unwrap()
            .then(() => {
                toast.success("Team restored successfully");
            })
            .catch((error) => toastError(error));
    };

    const handleClickTag = (tag: SelectTagOptionT) => {
        navigate({
            pathname: "/teams",
            search: createSearchParams({
                tags: tag.value.toString(),
            }).toString(),
        });
    };

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Modal open={editTeamOpen} onClose={() => setEditTeamOpen(false)}>
                <EditTeamForm
                    id={team.id}
                    onClose={() => setEditTeamOpen(false)}
                />
            </Modal>

            <Modal open={joinTeamOpen} onClose={() => setJoinTeamOpen(false)}>
                <TeamJoinRequestDialog
                    team_id={team.id}
                    onClose={() => setJoinTeamOpen(false)}
                />
            </Modal>

            <Box display="flex" alignItems="center" gap={1}>
                <Typography variant={"h5"}>{team.name}</Typography>

                {((!team.is_archived && profile.admin) ||
                    profile.id === team.manager?.value) && (
                    <EditButton onClick={() => setEditTeamOpen(true)} />
                )}

                {!team.is_archived && !team.is_current_user_member && (
                    <Button
                        onClick={() => setJoinTeamOpen(true)}
                        variant="outlined"
                        size="small"
                        startIcon={<PersonAddIcon />}
                    >
                        Join team
                    </Button>
                )}

                {!team.is_archived && (
                    <Button
                        onClick={goToTeamReports}
                        variant="outlined"
                        size="small"
                        color="info"
                        startIcon={<SummarizeIcon />}
                    >
                        Report by team
                    </Button>
                )}

                {profile.roles?.includes("super_admin") &&
                    (team.is_archived ? (
                        <Button
                            onClick={handleRestoreTeam}
                            variant="outlined"
                            size="small"
                            color="success"
                            startIcon={<RestoreIcon />}
                        >
                            Restore team
                        </Button>
                    ) : (
                        <Button
                            onClick={handleArchiveTeam}
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<ArchiveIcon />}
                        >
                            Archive team
                        </Button>
                    ))}
            </Box>

            {team.description && (
                <Box display="flex" flexDirection="column">
                    <Typography fontWeight="500">Description</Typography>
                    <Box maxHeight="200px" overflow="auto">
                        <ParsedHTMLContent text={team.description} />
                    </Box>
                </Box>
            )}

            <Box display="flex" gap={1}>
                <Typography>Team Lead: </Typography>
                {team.manager ? (
                    <Employee
                        employee={{
                            id: team.manager.value as number,
                            english_name: team.manager.label,
                            pararam: team.manager.label,
                        }}
                    />
                ) : (
                    <Typography> --- </Typography>
                )}
            </Box>

            {team.head_team && (
                <Typography
                    sx={{
                        "& a": {
                            color: "#0052cc",
                            textDecoration: "none",
                            "&:hover": {
                                textDecoration: "underline",
                            },
                        },
                    }}
                >
                    Head team:{" "}
                    <Link
                        to={`/teams/view/${
                            team.head_team.value
                        }/${team.head_team.label.replaceAll(" ", "+")}`}
                    >
                        <Chip label={team.head_team.label} variant="outlined" />
                    </Link>
                </Typography>
            )}

            {team.sub_teams.length ? (
                <Box display="flex" alignItems="center" gap={1}>
                    Sub teams:{" "}
                    {team.sub_teams.map((subTeam) => (
                        <Link
                            key={subTeam.value}
                            to={`/teams/view/${
                                subTeam.value
                            }/${subTeam.label.replaceAll(" ", "+")}`}
                        >
                            <Chip label={subTeam.label} variant="outlined" />
                        </Link>
                    ))}
                </Box>
            ) : null}

            {team.tags.length ? (
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography>Tags: </Typography>

                    {team.tags.map((tag) => (
                        <Tooltip key={tag.label} title={tag.description}>
                            <TeamTag
                                tag={tag}
                                onClick={() => handleClickTag(tag)}
                            />
                        </Tooltip>
                    ))}
                </Box>
            ) : null}
        </Box>
    );
};

export default TeamDescription;
