import SummarizeIcon from "@mui/icons-material/Summarize";
import {
    Box,
    CircularProgress,
    IconButton,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import { Employee } from "_components";
import { employeesApi } from "_redux";
import { format, parseISO } from "date-fns";
import { FC } from "react";
import { TeamHistoryRecordT } from "types";

const isEmployeeAction = (record: TeamHistoryRecordT) =>
    ["join", "leave", "set team lead"].includes(record.action);

const TeamHistory: FC<{ id: number }> = ({ id }) => {
    const { data } = employeesApi.useGetTeamHistoryQuery({ id });
    const [getCSV, getCSVProps] = employeesApi.useLazyExportTeamHistoryQuery();

    const getCSVHandle = () => {
        getCSV(id);
    };

    if (!data) return <LinearProgress />;

    return (
        <Box>
            <Box display="flex" justifyContent="flex-end" gap={1}>
                <Tooltip title="Export CSV">
                    <IconButton
                        onClick={getCSVHandle}
                        color="success"
                        disabled={getCSVProps.isLoading}
                    >
                        {getCSVProps.isLoading ? (
                            <CircularProgress size={20} color="success" />
                        ) : (
                            <SummarizeIcon />
                        )}
                    </IconButton>
                </Tooltip>
            </Box>
            <Box maxHeight="500px" overflow="scroll">
                <Table padding="none">
                    <TableBody>
                        {data.payload.items.map((record) => (
                            <TableRow
                                key={`${record.action}-${record.time}-${record.user?.id}`}
                            >
                                <TableCell>
                                    <Typography>
                                        {format(
                                            parseISO(record.time),
                                            "dd MMM Y HH:mm",
                                        )}
                                    </Typography>
                                </TableCell>

                                <TableCell>
                                    <Typography>{record.action}</Typography>
                                </TableCell>

                                <TableCell>
                                    {isEmployeeAction(record) &&
                                        (record.user ? (
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                                gap={1}
                                            >
                                                <Employee
                                                    employee={record.user}
                                                />

                                                <Typography fontSize={14}>
                                                    {record.user.pararam &&
                                                        `(@${record.user.pararam})`}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography> --- </Typography>
                                        ))}

                                    {record.action === "set name" && (
                                        <Box display="flex">
                                            <Typography>
                                                {record.name}
                                            </Typography>
                                        </Box>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
        </Box>
    );
};

export default TeamHistory;
