import { Typography } from "@mui/material";
import { FC, memo } from "react";
import { PresenceDetailsT } from "types";
import { ReportOutputWrapper } from "../report_output_wrapper";
import { PresenceDetails } from "./details";

interface IPresenceDetailsListProps {
    presenceList: PresenceDetailsT[];
    hideEmployee?: boolean;
    widthByContent?: boolean;
}

const PresenceDetailsList: FC<IPresenceDetailsListProps> = memo(
    ({ presenceList, hideEmployee, widthByContent }) => {
        if (presenceList.length === 0) {
            return <Typography variant="h6">No records</Typography>;
        }

        return (
            <ReportOutputWrapper
                tableWidthMode={widthByContent ? "fitContent" : undefined}
            >
                {presenceList.map((presence) => (
                    <PresenceDetails
                        key={presence.employee.id}
                        presence={presence}
                        hideEmployee={hideEmployee}
                    />
                ))}
            </ReportOutputWrapper>
        );
    },
);

export { PresenceDetailsList };
