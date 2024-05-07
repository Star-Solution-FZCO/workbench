import { Box, Button } from "@mui/material";
import { ParsedHTMLContent } from "_components";
import { FC } from "react";
import { PortalT, ServiceFieldT, ServiceT } from "types";
import { ServiceForm, ServiceHeader } from "../../components";

const mockPortal: PortalT = {
    id: 0,
    created: "",
    updated: "",
    is_active: true,
    name: "Portal",
    description: "Portal description",
    confluence_space_keys: "",
    youtrack_project: "",
};

const mockService: ServiceT = {
    id: 0,
    name: "",
    description: "",
    short_description: "",
    icon: "",
    user_fields: [],
    predefined_custom_fields: [],
    group: {
        id: 0,
        name: "",
        portal: mockPortal,
        created: "",
        updated: "",
        is_active: false,
    },
    tags: "",
    created: "",
    updated: "",
    is_active: false,
};

interface IMockService {
    portalId: number;
    portalName: string;
    serviceIcon: string;
    serviceName: string;
    serviceDescription: string;
    userFields: ServiceFieldT[];
}

const createMockService = ({
    portalId,
    portalName,
    serviceIcon,
    serviceName,
    serviceDescription,
    userFields,
}: IMockService): ServiceT => {
    return {
        ...mockService,
        name: serviceName,
        description: serviceDescription,
        icon: serviceIcon,
        user_fields: userFields,
        group: {
            ...mockService.group,
            portal: {
                ...mockService.group.portal,
                id: portalId,
                name: portalName,
            },
        },
    };
};

interface IPreviewServiceProps {
    service: IMockService;
    onBack: () => void;
}

const PreviewService: FC<IPreviewServiceProps> = ({
    service: mockService,
    onBack,
}) => {
    const service = createMockService(mockService);

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <ServiceHeader service={service} />

            <Box width="600px">
                <ParsedHTMLContent text={service.description} />
            </Box>

            <ServiceForm service={service} disabled />

            <Button
                sx={{ alignSelf: "flex-start" }}
                onClick={onBack}
                variant="outlined"
                size="small"
                color="info"
            >
                Back to edit
            </Button>
        </Box>
    );
};

export { PreviewService };
