import { FC } from "react";
import { ActivitySummaryT } from "types";
import { ReportOutputWrapper } from "../report_output_wrapper";
import { ActivitySummary } from "./summary";

interface IActivitySummaryListProps {
    summaryList: ActivitySummaryT[];
    hideEmployee?: boolean;
}

const ActivitySummaryList: FC<IActivitySummaryListProps> = ({
    summaryList,
    hideEmployee,
}) => {
    return (
        <ReportOutputWrapper>
            {summaryList.map((summary) => (
                <ActivitySummary
                    key={summary.employee.id}
                    summary={summary}
                    hideEmployee={hideEmployee}
                />
            ))}
        </ReportOutputWrapper>
    );
};

export { ActivitySummaryList };
