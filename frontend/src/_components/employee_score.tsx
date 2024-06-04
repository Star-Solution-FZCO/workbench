import { Box, LinearProgress, Tooltip } from "@mui/material";
import { reportsApi } from "_redux";
import { nDaysAgo, today } from "config";
import { FC } from "react";
import { formatDateHumanReadable } from "utils/convert";

const gradientStart = [214, 230, 133];
const gradientEnd = [30, 104, 35];
const maxScore = 15;

const gradientColor = (score: number) => {
    if (score <= 0) {
        return "#cccccc";
    }
    const gradientResult = [];
    for (let i = 0; i < 3; i++) {
        if (score > maxScore) {
            score = maxScore;
        }
        gradientResult[i] = Math.round(
            gradientStart[i] +
                ((gradientEnd[i] - gradientStart[i]) * score) / maxScore,
        )
            .toString(16)
            .padStart(2, "0");
    }
    return `#${gradientResult.join("")}`;
};

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
                                                background: gradientColor(
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
