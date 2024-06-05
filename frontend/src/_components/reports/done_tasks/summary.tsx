import { Employee } from "_components/employee";
import { useAppSelector } from "_redux";
import { formatInTimeZone } from "date-fns-tz";
import { capitalize } from "lodash";
import { FC } from "react";
import { DoneTasksSummaryT } from "types";
import { weightedSumDayColor } from "utils";
import { ReportOutputWrapper } from "../report_output_wrapper";

interface IDoneTasksSummaryProps {
    data: DoneTasksSummaryT;
}

const DoneTasksSummary: FC<IDoneTasksSummaryProps> = ({ data }) => {
    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "GMT";

    return (
        <table>
            <thead>
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
                        <Employee employee={data.employee} />
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
                    <th>Day</th>
                    <th>Day type</th>
                    <th>YT Resolved issues</th>
                    <th>Merged gerrit commits</th>
                    <th>Gerrit comments</th>
                    <th>CVS commits</th>
                    <th>Weighted sum</th>
                </tr>
            </thead>

            <tbody>
                {Object.entries(data.days).map(([day, data]) => (
                    <tr
                        key={day}
                        style={{
                            background: weightedSumDayColor(
                                data.item.weighted_sum,
                                data.day_status,
                            ),
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
                        <td>{data.item.issues}</td>
                        <td>{data.item.gerrit_commits}</td>
                        <td>{data.item.gerrit_comments}</td>
                        <td>{data.item.cvs_commits}</td>
                        <td>
                            <strong>{data.item.weighted_sum}</strong>
                        </td>
                    </tr>
                ))}

                <tr>
                    <td colSpan={2}>
                        <strong>Total</strong>
                    </td>
                    <td>
                        <strong>{data.total.issues}</strong>
                    </td>
                    <td>
                        <strong>{data.total.gerrit_commits}</strong>
                    </td>
                    <td>
                        <strong>{data.total.gerrit_comments}</strong>
                    </td>
                    <td>
                        <strong>{data.total.cvs_commits}</strong>
                    </td>
                    <td>
                        <strong>{data.total.weighted_sum}</strong>
                    </td>
                </tr>
            </tbody>
        </table>
    );
};

interface IDoneTasksSummaryListProps {
    data: DoneTasksSummaryT[];
}

const DoneTasksSummaryList: FC<IDoneTasksSummaryListProps> = ({ data }) => {
    return (
        <ReportOutputWrapper>
            {data.map((summary) => (
                <DoneTasksSummary key={summary.employee.id} data={summary} />
            ))}
        </ReportOutputWrapper>
    );
};

export { DoneTasksSummaryList };
