import LinkIcon from "@mui/icons-material/Link";
import { IconButton } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { Employee } from "_components/employee";
import { useAppSelector } from "_redux";
import { activityReportColumnMap } from "config";
import { FC } from "react";
import {
    createSearchParams,
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import { ActivityReportColumnT, ActivitySummaryTotalT } from "types";
import { ReportOutputWrapper } from "../report_output_wrapper";

interface IActivitySummaryTotalProps {
    data: ActivitySummaryTotalT[];
}

const ActivitySummaryTotal: FC<IActivitySummaryTotalProps> = ({ data }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const activityReportColumns = useAppSelector(
        (state) => state.shared.activityReportColumns,
    );

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
                        {activityReportColumnMap.map((record) =>
                            activityReportColumns[record.key] ? (
                                <th key={record.key}>{record.label}</th>
                            ) : null,
                        )}
                        <th>Vacations</th>
                        <th>Sick days</th>
                        <th>Working days</th>
                        <th>Summary</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((record) => (
                        <tr key={nanoid()} tabIndex={0}>
                            <td>
                                <Employee employee={record.employee} />
                            </td>
                            {Object.entries(record.item).map(([key, value]) =>
                                activityReportColumns[
                                    key as ActivityReportColumnT
                                ] ? (
                                    <td key={nanoid()}>{value}</td>
                                ) : null,
                            )}
                            <td>{record.item.vacations}</td>
                            <td>{record.item.sick_days}</td>
                            <td>{record.item.working_days}</td>
                            <td>
                                <IconButton
                                    sx={{ p: 0 }}
                                    color="info"
                                    onClick={() =>
                                        navigate({
                                            pathname:
                                                "/reports/activity-summary",
                                            search: createSearchParams({
                                                id: record.employee.id.toString(),
                                                start: start!,
                                                end: end!,
                                            }).toString(),
                                        })
                                    }
                                >
                                    <LinkIcon />
                                </IconButton>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </ReportOutputWrapper>
    );
};

export { ActivitySummaryTotal };
