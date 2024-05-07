import LinkIcon from "@mui/icons-material/Link";
import { IconButton } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { Employee } from "_components/employee";
import { useAppSelector } from "_redux";
import { activityReportColumnMap, dayBackgroundStyleMap } from "config";
import { isToday } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { capitalize } from "lodash";
import { FC } from "react";
import { createSearchParams, useNavigate } from "react-router-dom";
import { ActivityReportColumnT, ActivitySummaryT } from "types";
import { isNotWorkingDay } from "utils";

interface IActivitySummaryProps {
    summary: ActivitySummaryT;
    hideEmployee?: boolean;
}

const ActivitySummary: FC<IActivitySummaryProps> = ({
    summary,
    hideEmployee,
}) => {
    const navigate = useNavigate();

    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "GMT";
    const activityReportColumns = useAppSelector(
        (state) => state.shared.activityReportColumns,
    );

    return (
        <table>
            <thead>
                {!hideEmployee && (
                    <tr>
                        <th
                            colSpan={13}
                            style={{
                                position: "sticky",
                                top: 0,
                                background: "#fff",
                                zIndex: 1,
                            }}
                        >
                            <Employee employee={summary.employee} />
                        </th>
                    </tr>
                )}
                <tr
                    style={{
                        position: "sticky",
                        top: hideEmployee ? 0 : 31,
                        background: "#fff",
                        zIndex: 1,
                    }}
                >
                    <th>Day</th>
                    <th>Day type</th>
                    {activityReportColumnMap.map((record) =>
                        activityReportColumns[record.key] ? (
                            <th key={record.key}>{record.label}</th>
                        ) : null,
                    )}
                    <th>Details</th>
                </tr>
            </thead>

            <tbody>
                {Object.entries(summary.days).map(([day, data]) => (
                    <tr
                        key={day}
                        style={{
                            ...(!data.has_activity &&
                                !isToday(new Date(day)) && {
                                    background: "#EF8354",
                                }),
                            ...(isNotWorkingDay(data.day_status) && {
                                background: "#ffa3a6",
                            }),
                            ...(data.day_status === "day_before_employment" && {
                                background:
                                    dayBackgroundStyleMap[
                                        "day_before_employment"
                                    ],
                            }),
                        }}
                        tabIndex={0}
                    >
                        <td>
                            {formatInTimeZone(
                                new Date(day),
                                timezone,
                                "dd MMM yyyy (E)",
                            )}
                        </td>

                        <td>
                            {capitalize(data.day_status.split("_").join(" "))}
                        </td>

                        {Object.entries(data.item).map(([key, value]) =>
                            activityReportColumns[
                                key as ActivityReportColumnT
                            ] ? (
                                <td key={nanoid()}>
                                    {value === "0" || value === "0:00:00"
                                        ? "-"
                                        : value}
                                </td>
                            ) : null,
                        )}

                        <td>
                            <IconButton
                                sx={{ p: 0 }}
                                color="info"
                                onClick={() =>
                                    navigate({
                                        pathname: "/reports/activity-details",
                                        search: createSearchParams({
                                            id: summary.employee.id.toString(),
                                            start: day,
                                            end: day,
                                        }).toString(),
                                    })
                                }
                            >
                                <LinkIcon />
                            </IconButton>
                        </td>
                    </tr>
                ))}

                <tr>
                    <td colSpan={2}>
                        <strong>Total</strong>
                    </td>
                    {Object.entries(summary.total).map(([key, value]) =>
                        activityReportColumns[key as ActivityReportColumnT] ? (
                            <td key={nanoid()}>
                                <strong>{value}</strong>
                            </td>
                        ) : null,
                    )}
                    <td>-</td>
                </tr>
            </tbody>
        </table>
    );
};

export { ActivitySummary };
