import { FC } from "react";
import { ActivityDetailsT } from "types";
import { ReportOutputWrapper } from "../report_output_wrapper";
import { ActivityDetails } from "./details";

interface IActivityDetailsListProps {
    detailsList: ActivityDetailsT[];
}

const ActivityDetailsList: FC<IActivityDetailsListProps> = ({
    detailsList,
}) => {
    return (
        <ReportOutputWrapper>
            {detailsList.map((details) => (
                <ActivityDetails key={details.employee.id} details={details} />
            ))}
        </ReportOutputWrapper>
    );
};

export { ActivityDetailsList };
