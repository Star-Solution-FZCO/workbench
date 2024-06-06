import { nanoid } from "@reduxjs/toolkit";
import { Employee } from "_components/employee";

import { FC } from "react";

import { DoneTasksSummaryTotalT } from "types";
import { ReportOutputWrapper } from "../report_output_wrapper";

interface IDoneTasksSummaryTotalProps {
    data: DoneTasksSummaryTotalT[];
}

const DoneTasksSummaryTotal: FC<IDoneTasksSummaryTotalProps> = ({ data }) => (
    <ReportOutputWrapper>
        <table>
            <thead>
                <tr
                    style={{
                        position: "sticky",
                        top: 0,
                        background: "#fff",
                        zIndex: 1,
                    }}
                >
                    <th>Person</th>
                    <th>YT Resolved issues</th>
                    <th>Merged gerrit commits</th>
                    <th>Gerrit comments</th>
                    <th>CVS commits</th>
                    <th>Vacations</th>
                    <th>Sick days</th>
                    <th>Working days</th>
                    <th>Weighted sum</th>
                    <th>Avg weighted sum</th>
                </tr>
            </thead>

            <tbody>
                {data.map((record) => (
                    <tr key={nanoid()} tabIndex={0}>
                        <td>
                            <Employee employee={record.employee} />
                        </td>
                        <td>{record.item.issues}</td>
                        <td>{record.item.gerrit_commits}</td>
                        <td>{record.item.gerrit_comments}</td>
                        <td>{record.item.cvs_commits}</td>
                        <td>{record.item.vacations}</td>
                        <td>{record.item.sick_days}</td>
                        <td>{record.item.working_days}</td>
                        <td>
                            <strong>{record.item.weighted_sum}</strong>
                        </td>
                        <td>
                            <strong>
                                {record.item.working_days
                                    ? Math.round(
                                          (100 * record.item.weighted_sum) /
                                              record.item.working_days,
                                      ) / 100
                                    : "-"}
                            </strong>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </ReportOutputWrapper>
);

export { DoneTasksSummaryTotal };
