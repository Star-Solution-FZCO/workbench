import { nanoid } from "@reduxjs/toolkit";
import { Employee } from "_components/employee";
import { useAppSelector } from "_redux";
import { dayBackgroundStyleMap } from "config";
import { format, isToday, parse } from "date-fns";
import { capitalize } from "lodash";
import { FC, Fragment } from "react";
import { PresenceDayT, PresenceDetailsT } from "types";
import { isNotWorkingDay } from "utils";
import { HHmmUTCtoTZ } from "utils/convert";

interface IPresenceCellsProps {
    item: PresenceDayT;
    timezone: string;
    bold?: boolean;
    total?: boolean;
}

const PresenceCells: FC<IPresenceCellsProps> = ({
    item,
    timezone,
    bold,
    total,
}) => {
    return (
        <>
            {Object.entries(item)
                .slice(total ? 2 : 0, -4)
                .map(([key, value]) => {
                    let newValue = value;

                    if (
                        typeof value === "string" &&
                        value.length !== 0 &&
                        !["00:00", "0:00:00", "---"].includes(value)
                    ) {
                        newValue = ["come", "leave"].includes(key)
                            ? HHmmUTCtoTZ(value, timezone)
                            : value;
                    }

                    return (
                        <td key={nanoid()} align="center">
                            {bold ? <strong>{newValue}</strong> : newValue}
                        </td>
                    );
                })}
        </>
    );
};

interface IPresenceDetailsProps {
    presence: PresenceDetailsT;
    hideEmployee?: boolean;
}

const PresenceDetails: FC<IPresenceDetailsProps> = ({
    presence,
    hideEmployee,
}) => {
    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "GMT";

    return (
        <table>
            <thead>
                {!hideEmployee && (
                    <tr>
                        <th
                            colSpan={11}
                            style={{
                                position: "sticky",
                                top: 0,
                                background: "#fff",
                                zIndex: 1,
                            }}
                        >
                            <Employee employee={presence.employee} />
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
                    <th>Come</th>
                    <th>Leave</th>
                    <th>Total</th>
                    <th>Awake</th>
                    <th>Away</th>
                </tr>
            </thead>

            <tbody>
                {Object.entries(presence.days).map(([day, data]) => (
                    <Fragment key={day}>
                        <tr
                            style={{
                                ...(!data.has_activity &&
                                    !isToday(new Date(day)) && {
                                        background: "#EF8354",
                                    }),
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
                            tabIndex={0}
                        >
                            <td>
                                <strong>
                                    {format(
                                        parse(day, "yyyy-MM-dd", new Date()),
                                        "dd MMM yyyy (E)",
                                    )}
                                </strong>
                            </td>

                            <td>
                                {capitalize(
                                    data.day_status.split("_").join(" "),
                                )}
                            </td>

                            <PresenceCells
                                timezone={timezone}
                                item={data.item}
                            />
                        </tr>
                    </Fragment>
                ))}

                <tr>
                    <td align="center" colSpan={4}>
                        <strong>Total per range</strong>
                    </td>

                    <PresenceCells
                        timezone={timezone}
                        item={presence.total}
                        bold
                        total
                    />
                </tr>

                {Object.entries(presence.total)
                    .slice(-4)
                    .map(([key, value]) => (
                        <Fragment key={nanoid()}>
                            <tr>
                                <td colSpan={4}>
                                    <strong>
                                        {capitalize(key.split("_").join(" "))}
                                    </strong>
                                </td>
                                <td colSpan={3}>
                                    <strong>{value}</strong>
                                </td>
                            </tr>
                        </Fragment>
                    ))}
            </tbody>
        </table>
    );
};

export { PresenceDetails };
