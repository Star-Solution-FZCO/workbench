import { Box, Button, Typography } from "@mui/material";
import { LeaveButton, Modal } from "_components";
import { employeesApi } from "_redux";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import { TeamMemberT } from "types";
import { toastError } from "utils";

interface IDismissButtonProps {
    member: TeamMemberT;
    can_dismiss: boolean;
}

const DismissButton: FC<IDismissButtonProps> = ({ member, can_dismiss }) => {
    const [modalOpen, setModalOpen] = useState(false);

    const [updateEmployee] = employeesApi.useUpdateEmployeeMutation();
    // const [updateCounteragent] = employeesApi.useUpdateCounteragentMutation();

    const dismissFromTeam = () => {
        updateEmployee({
            id: Number(member.id),
            team: null,
        })
            .unwrap()
            .then(() => {
                toast.success(`${member.english_name} dismissed from team`);
                setModalOpen(false);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return can_dismiss ? (
        <>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={2}
                >
                    <Typography>
                        Are you sure you want to dismiss{" "}
                        <Typography component="span" fontWeight="medium">
                            {member.english_name}
                        </Typography>{" "}
                        from team?
                    </Typography>

                    <Box display="flex" gap={1}>
                        <Button variant="outlined" onClick={dismissFromTeam}>
                            Dismiss
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={() => setModalOpen(false)}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <Box
                width="100%"
                display="flex"
                justifyContent="center"
                alignItems="center"
            >
                <LeaveButton
                    tooltip="Dismiss from team"
                    onClick={(e) => {
                        e.stopPropagation();
                        setModalOpen(true);
                    }}
                />
            </Box>
        </>
    ) : null;
};

export default DismissButton;
