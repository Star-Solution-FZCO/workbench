import { Box, LinearProgress, Tooltip } from "@mui/material";
import { reportsApi } from "_redux";
import { nDaysAgo } from "config";
import { capitalize } from "lodash";
import { FC } from "react";
import { weightedSumDayColor } from "utils";
import { formatDateHumanReadable } from "utils/convert";

export const EmployeeDoneTaskScore: FC<{ employeeId: number }> = ({
    employeeId,
}) => {
    const { data, isLoading } = reportsApi.useGetDoneTasksSummaryReportQuery({
        start: nDaysAgo(14).toISOString().substring(0, 10),
        end: nDaysAgo(1).toISOString().substring(0, 10),
        filter: `id: ${employeeId}`,
    });

    if (isLoading || !data || data.payload.items.length === 0) {
        return <LinearProgress />;
    }

    if (!data || data.payload.items.length === 0) {
        return <></>;
    }

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100%"
            height="100%"
        >
            <table
                style={{
                    borderSpacing: "1px 0",
                }}
            >
                <tbody>
                    <tr>
                        {Object.entries(data.payload.items[0].days).map(
                            ([key, data]) => (
                                <td id={key}>
                                    <Tooltip
                                        title={`${formatDateHumanReadable(key)}: ${data.item.weighted_sum} (${capitalize(data.day_status.split("_").join(" "))})`}
                                    >
                                        <div
                                            style={{
                                                minWidth: "14px",
                                                minHeight: "14px",
                                                background: weightedSumDayColor(
                                                    data.item.weighted_sum,
                                                    data.day_status,
                                                ),
                                                border: "1px solid #ddd",
                                            }}
                                        />
                                    </Tooltip>
                                </td>
                            ),
                        )}
                    </tr>
                </tbody>
            </table>
        </Box>
    );
};
