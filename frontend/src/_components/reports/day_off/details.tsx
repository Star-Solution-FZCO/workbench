import { Typography } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { Employee } from "_components/employee";
import { capitalize } from "lodash";
import { FC, Fragment } from "react";
import { DayOffDetailsReportItemT } from "types";
import { ReportOutputWrapper } from "../report_output_wrapper";

interface IDayOffDetailsReportProps {
    data: DayOffDetailsReportItemT[];
}

const DayOffDetailsReportTable: FC<IDayOffDetailsReportProps> = ({ data }) => {
    return (
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
                    <th>Email</th>
                    <th>Cooperation type</th>
                    <th>Organization</th>
                    <th colSpan={2}>Start</th>
                    <th colSpan={2}>End</th>
                    <th colSpan={2}>Days</th>
                    <th colSpan={2}>Type</th>
                </tr>
            </thead>

            <tbody>
                {data.map((record) => (
                    <Fragment key={nanoid()}>
                        {record.items.length > 0
                            ? record.items.map((item, index) => (
                                  <tr key={nanoid()}>
                                      {index === 0 && (
                                          <td
                                              rowSpan={record.items.length}
                                              style={{
                                                  verticalAlign: "top",
                                                  width: "250px",
                                              }}
                                          >
                                              <Employee
                                                  employee={record.employee}
                                              />
                                          </td>
                                      )}
                                      <td rowSpan={record.items.length}>
                                          <strong>
                                              {record.employee.email}
                                          </strong>
                                      </td>
                                      <td rowSpan={record.items.length}>
                                          <strong>
                                              {record.employee?.cooperation_type
                                                  ?.label || "N/A"}
                                          </strong>
                                      </td>
                                      <td rowSpan={record.items.length}>
                                          <strong>
                                              {record.employee?.organization
                                                  ?.label || "N/A"}
                                          </strong>
                                      </td>
                                      <td colSpan={2}>
                                          <strong>{item.start}</strong>
                                      </td>
                                      <td colSpan={2}>
                                          <strong>{item.end}</strong>
                                      </td>
                                      <td colSpan={2}>
                                          <strong>{item.days}</strong>
                                      </td>
                                      <td colSpan={2}>
                                          <strong>
                                              {capitalize(
                                                  item.type
                                                      .split("_")
                                                      .join(" "),
                                              )}
                                          </strong>
                                      </td>
                                  </tr>
                              ))
                            : null}
                    </Fragment>
                ))}
            </tbody>
        </table>
    );
};

interface IDayOffDetailsReportListProps {
    data: DayOffDetailsReportItemT[];
}

const DayOffDetailsReportList: FC<IDayOffDetailsReportListProps> = ({
    data,
}) => {
    return data.some((record) => record.items.length > 0) ? (
        <ReportOutputWrapper>
            <DayOffDetailsReportTable data={data} />
        </ReportOutputWrapper>
    ) : (
        <Typography fontWeight={500}>No records</Typography>
    );
};

export { DayOffDetailsReportList };
