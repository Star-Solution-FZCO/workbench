import { FC } from "react";
import { DueDateReportItemT } from "types";
import { ReportOutputWrapper } from "../report_output_wrapper";
import { DueDateReportItem } from "./item";

interface IDueDateListProps {
    items: DueDateReportItemT[];
}

const DueDateReportList: FC<IDueDateListProps> = ({ items }) => {
    return (
        <ReportOutputWrapper>
            {items
                .filter((data) => data.items.length > 0)
                .map((data) => (
                    <DueDateReportItem key={data.employee.id} data={data} />
                ))}
        </ReportOutputWrapper>
    );
};

export { DueDateReportList };
