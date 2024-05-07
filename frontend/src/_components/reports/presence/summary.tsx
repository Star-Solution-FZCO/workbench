import { nanoid } from "@reduxjs/toolkit";
import { Employee } from "_components/employee";
import { FC } from "react";
import { PresenceSummaryT } from "types";
import { ReportOutputWrapper } from "../report_output_wrapper";

interface IPresenceSummaryProps {
    data: PresenceSummaryT[];
}

const PresenceSummary: FC<IPresenceSummaryProps> = ({ data }) => {
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
                        <th>Person</th>
                        <th>Total</th>
                        <th>Awake</th>
                        <th>Away</th>
                        <th>On weekend</th>
                        <th>Missed</th>
                        <th>Vacations</th>
                        <th>Sick days</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((record) => (
                        <tr key={nanoid()} tabIndex={0}>
                            <td>
                                <Employee employee={record.employee} />
                            </td>
                            <td>{record.item.total}</td>
                            <td>{record.item.awake}</td>
                            <td>{record.item.away}</td>
                            <td>{record.item.on_weekend}</td>
                            <td>{record.item.missed}</td>
                            <td>{record.item.vacations}</td>
                            <td>{record.item.sick_days}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </ReportOutputWrapper>
    );
};

export { PresenceSummary };
