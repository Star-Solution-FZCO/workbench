import { Theme, useTheme } from "@mui/material";
import { Employee } from "_components/employee";
import { YOUTRACK_URL, today } from "config";
import { FC } from "react";
import { DueDateReportIssueT, DueDateReportItemT } from "types";
import { formatDateHumanReadable } from "utils/convert";

const getColor = (item: DueDateReportIssueT, theme: Theme) => {
    if (item.resolved) {
        return theme.palette.success.main;
    }
    if (item.unplanned) {
        return theme.palette.info.main;
    }
    if (new Date(item.due_date + "Z") < today()) {
        return theme.palette.error.main;
    }
    return "inherit";
};

interface IDueDateReportItemProps {
    data: DueDateReportItemT;
}

const DueDateReportItem: FC<IDueDateReportItemProps> = ({ data }) => {
    const theme = useTheme();

    return (
        <table>
            <thead>
                <tr>
                    <th
                        colSpan={6}
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
                    <th style={{ width: "100px" }}>ID</th>
                    <th style={{ width: "400px" }}>Subject</th>
                    <th style={{ width: "100px" }}>Severity</th>
                    <th style={{ width: "100px" }}>Priority</th>
                    <th style={{ width: "100px" }}>Due Date</th>
                    <th style={{ width: "400px" }}>Sprints</th>
                </tr>
            </thead>

            <tbody>
                {data.items.map((item) => (
                    <tr
                        key={item.id}
                        style={{
                            backgroundColor: getColor(item, theme),
                            color:
                                item.resolved ||
                                item.unplanned ||
                                new Date(item.due_date + "Z") < today()
                                    ? "white"
                                    : "inherit",
                            fontWeight: 500,
                        }}
                        tabIndex={0}
                    >
                        <td>
                            <a href={YOUTRACK_URL + "/issue/" + item.id}>
                                {item.id}
                            </a>
                        </td>
                        <td>{item.subject}</td>
                        <td>{item.severity}</td>
                        <td>{item.priority}</td>
                        <td>{formatDateHumanReadable(item.due_date)}</td>
                        <td>{item.sprints}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export { DueDateReportItem };
