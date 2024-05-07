import { GridColDef } from "@mui/x-data-grid";
import { catalogsApi } from "_redux";
import { OrganizationT } from "types/models";
import { CatalogListView } from "../components";
import { CreateOrganizationForm, EditOrganizationForm } from "./form";

export const OrganizationList = () => {
    const columns: GridColDef<OrganizationT>[] = [
        { field: "name", headerName: "Name", flex: 1 },
    ];

    return (
        <CatalogListView
            entityName="Organization"
            dataQueryFn={catalogsApi.useListOrganizationQuery}
            getEntityQueryFn={catalogsApi.useGetOrganizationQuery}
            archiveMutation={catalogsApi.useArchiveOrganizationMutation}
            restoreMutation={catalogsApi.useRestoreOrganizationMutation}
            columns={columns}
            createForm={(onClose) => (
                <CreateOrganizationForm onClose={onClose} />
            )}
            editForm={(onClose, id) => (
                <EditOrganizationForm onClose={onClose} id={id} />
            )}
            archivable
        />
    );
};
