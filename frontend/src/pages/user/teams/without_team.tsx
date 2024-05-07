import { Box, CircularProgress, Typography } from "@mui/material";
import { AddGroupButton, Employee, Modal, initialListState } from "_components";
import { employeesApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { todayUTC } from "config";
import { map } from "lodash";
import React, { useState } from "react";
import { EditEmployeeTeamForm } from "./edit_team_form";

export const EmployeeWithoutTeam: React.FC = () => {
    const profile = useAppSelector(({ profile }) => profile.payload);

    const without_team = employeesApi.useListEmployeeQuery(
        makeListParams(
            {
                ...initialListState,
                limit: 200,
                filter: {
                    team: "team_id:null",
                    active: "active:true",
                    work_started: `work_started___le:"${todayUTC()}"`,
                },
            },
            [],
        ),
    );

    const [openEditEmployeeTeamWindow, setOpenEditEmployeeTeamWindow] =
        useState<{ id: number | null; is_open: boolean }>({
            id: null,
            is_open: false,
        });

    const renderEditEmployeeTeamModalWindow = (
        id: number,
        onClose: () => void,
    ) => {
        return (
            <Modal open onClose={onClose}>
                <EditEmployeeTeamForm
                    initialValues={{ id, team: null }}
                    onSuccess={onClose}
                />
            </Modal>
        );
    };

    if (without_team.isUninitialized || !without_team.data)
        return <CircularProgress color="success" />;

    return (
        <>
            {openEditEmployeeTeamWindow.is_open &&
                renderEditEmployeeTeamModalWindow(
                    openEditEmployeeTeamWindow.id as number,
                    () => {
                        setOpenEditEmployeeTeamWindow({
                            id: null,
                            is_open: false,
                        });
                    },
                )}
            {map(without_team.data.payload.items, (user) => (
                <Box display="flex" alignItems="center" gap={1}>
                    {["admin", "super_admin", "super_hr"].some((role) =>
                        profile.roles?.includes(role),
                    ) && (
                        <AddGroupButton
                            tooltip="Add to team"
                            onClick={() =>
                                setOpenEditEmployeeTeamWindow({
                                    id: user.id,
                                    is_open: true,
                                })
                            }
                        />
                    )}

                    <Employee employee={user} />

                    <Typography>(@{user.pararam})</Typography>
                </Box>
            ))}
        </>
    );
};
