import { nanoid } from "@reduxjs/toolkit";
import { Employee } from "_components";
import { ReportOutputWrapper } from "_components/reports/report_output_wrapper";
import { FC, memo } from "react";
import { TeamMemberReportItemT } from "types";
import { formatDateHumanReadable } from "utils/convert.ts";

interface ITeamMembersReportListProps {
    data: TeamMemberReportItemT[];
}

const TeamMembersReportList: FC<ITeamMembersReportListProps> = memo(
    ({ data }) => {
        return (
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
                            <th>Team</th>
                            <th>Person</th>
                            <th>Days in team</th>
                            <th>Email</th>
                            <th>Pararam</th>
                            <th>Cooperation type</th>
                            <th>Organization</th>
                            <th>Position</th>
                            <th>Work started</th>
                            <th>Work ended</th>
                            <th>Contract date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((record) =>
                            record.items.map((item) => (
                                <tr key={nanoid()}>
                                    <td>{record.team.name}</td>
                                    <td width="200px">
                                        <Employee employee={item.employee} />
                                    </td>
                                    <td>{item.days}</td>
                                    <td>{item.employee.email}</td>
                                    <td>{item.employee.pararam}</td>
                                    <td>
                                        {item.employee.cooperation_type?.label}
                                    </td>
                                    <td>{item.employee.organization?.label}</td>
                                    <td>{item.employee.position?.label}</td>
                                    <td>
                                        {item.employee.work_started
                                            ? formatDateHumanReadable(
                                                  item.employee.work_started,
                                              )
                                            : ""}
                                    </td>
                                    <td>
                                        {item.employee.work_ended
                                            ? formatDateHumanReadable(
                                                  item.employee.work_ended,
                                              )
                                            : ""}
                                    </td>
                                    <td>
                                        {item.employee.contract_date
                                            ? formatDateHumanReadable(
                                                  item.employee.contract_date,
                                              )
                                            : ""}
                                    </td>
                                </tr>
                            )),
                        )}
                    </tbody>
                </table>
            </ReportOutputWrapper>
        );
    },
);

export { TeamMembersReportList };
