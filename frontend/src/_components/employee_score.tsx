import { Box, LinearProgress, Tooltip } from "@mui/material";
import { reportsApi } from "_redux";
import { nDaysAgo, today } from "config";
import { FC } from "react";
import { weightedSumGradientColor } from "utils";
import { formatDateHumanReadable } from "utils/convert";

export const EmployeeDoneTaskScore: FC<{ employeeId: number }> = ({
    employeeId,
}) => {
    const { data, isLoading } = reportsApi.useGetDoneTasksSummaryReportQuery({
        start: nDaysAgo(13).toISOString().substring(0, 10),
        end: today().toISOString().substring(0, 10),
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
                                        title={`${formatDateHumanReadable(key)}: ${data.item.weighted_sum}`}
                                    >
                                        <div
                                            style={{
                                                minWidth: "12px",
                                                minHeight: "12px",
                                                background:
                                                    weightedSumGradientColor(
                                                        data.item.weighted_sum,
                                                    ),
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
