import { Typography } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { Employee } from "_components";
import { FC } from "react";
import { DayOffSummaryReportItemT } from "types";
import { ReportOutputWrapper } from "../report_output_wrapper";

interface IDayOffSummaryReportProps {
    data: DayOffSummaryReportItemT[];
}

const DayOffSummaryReport: FC<IDayOffSummaryReportProps> = ({ data }) => {
    if (!data.length) {
        return <Typography fontWeight={500}>No records</Typography>;
    }

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
                        <th>Vacation</th>
                        <th>Sick day</th>
                        <th>Business trip</th>
                        <th>Unpaid leave</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((record) => (
                        <tr key={nanoid()}>
                            <td>
                                <Employee employee={record.employee} />
                            </td>
                            {Object.keys(record.total).map((key) => (
                                <td key={key}>
                                    <strong>
                                        {
                                            record.total[
                                                key as keyof typeof record.total
                                            ]
                                        }
                                    </strong>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </ReportOutputWrapper>
    );
};

export { DayOffSummaryReport };
