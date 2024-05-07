import { Box, LinearProgress } from "@mui/material";
import { ParsedHTMLContent } from "_components";
import { helpCenterApi } from "_redux";
import { useParams } from "react-router-dom";
import { ServiceForm, ServiceHeader } from "../components";

const ApplyService = () => {
    const { id } = useParams();

    const { data: service, isLoading } = helpCenterApi.useGetServiceQuery(
        Number(id),
    );

    if (isLoading) return <LinearProgress />;

    return (
        <Box display="flex" flexDirection="column" gap={1} width="600px">
            {service?.payload && (
                <>
                    <ServiceHeader service={service.payload} />

                    <Box width="100%">
                        <ParsedHTMLContent text={service.payload.description} />
                    </Box>

                    <ServiceForm service={service.payload} />
                </>
            )}
        </Box>
    );
};

export default ApplyService;
