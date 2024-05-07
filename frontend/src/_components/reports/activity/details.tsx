import { nanoid } from "@reduxjs/toolkit";
import { Employee } from "_components/employee";
import { useAppSelector } from "_redux";
import { dayBackgroundStyleMap } from "config";
import { parse } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { capitalize } from "lodash";
import { FC, Fragment } from "react";
import { ActivityDetailsT } from "types";
import { isNotWorkingDay } from "utils";

const fromUTCtoZonedTime = (dt: string, timezone: string) => {
    const d = parse(dt, "dd MMM yyyy HH:mm:ss", new Date());
    const utcDate = new Date(
        Date.UTC(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
            d.getHours(),
            d.getMinutes(),
            d.getSeconds(),
        ),
    );
    return formatInTimeZone(utcDate, timezone, "dd MMMM yyyy - HH:mm:ss (O)");
};

interface IActivityDetailsProps {
    details: ActivityDetailsT;
}

const ActivityDetails: FC<IActivityDetailsProps> = ({ details }) => {
    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "GMT";

    return (
        <table>
            <thead>
                <tr>
                    <th
                        colSpan={4}
                        style={{
                            position: "sticky",
                            top: 0,
                            background: "#fff",
                            zIndex: 1,
                        }}
                    >
                        <Employee employee={details.employee} />
                    </th>
                </tr>
                <tr
                    style={{
                        position: "sticky",
                        top: 31,
                        background: "#fff",
                        zIndex: 1,
                    }}
                >
                    <th>Time</th>
                    <th>Source</th>
                    <th>Task</th>
                    <th>State</th>
                </tr>
            </thead>

            <tbody>
                {Object.entries(details.days).map(([day, data]) => (
                    <Fragment key={day}>
                        <tr
                            style={{
                                ...(isNotWorkingDay(data.day_status) && {
                                    background: "#ffa3a6",
                                }),
                                ...(data.day_status ===
                                    "day_before_employment" && {
                                    background:
                                        dayBackgroundStyleMap[
                                            "day_before_employment"
                                        ],
                                }),
                            }}
                        >
                            <td colSpan={5} align="center">
                                <strong>
                                    {formatInTimeZone(
                                        new Date(day),
                                        timezone,
                                        "dd MMM yyyy (E)",
                                    )}{" "}
                                    -{" "}
                                    {capitalize(
                                        data.day_status.split("_").join(" "),
                                    )}
                                </strong>
                            </td>
                        </tr>

                        {data.items.map((day) => (
                            <tr key={nanoid()} tabIndex={0}>
                                <td>
                                    {fromUTCtoZonedTime(day.time, timezone)}
                                </td>
                                <td>{day.source}</td>
                                <td
                                    dangerouslySetInnerHTML={{
                                        __html: day.target,
                                    }}
                                />
                                <td>{day.action}</td>
                            </tr>
                        ))}
                    </Fragment>
                ))}
            </tbody>
        </table>
    );
};

export { ActivityDetails };
