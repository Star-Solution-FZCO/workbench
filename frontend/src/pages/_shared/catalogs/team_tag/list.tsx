import { GridColDef } from "@mui/x-data-grid";
import { catalogsApi } from "_redux";
import { TeamTagT } from "types/models";
import { CatalogListView } from "../components";
import { CreateTeamTagForm, EditTeamTagForm } from "./form";

export const TeamTagList = () => {
    const columns: GridColDef<TeamTagT>[] = [
        { field: "name", headerName: "Name", flex: 1 },
        { field: "description", headerName: "Description", flex: 1 },
    ];

    return (
        <CatalogListView
            entityName="Team tag"
            dataQueryFn={catalogsApi.useListTeamTagQuery}
            getEntityQueryFn={catalogsApi.useGetTeamTagQuery}
            archiveMutation={catalogsApi.useArchiveTeamTagMutation}
            restoreMutation={catalogsApi.useRestoreTeamTagMutation}
            columns={columns}
            createForm={(onClose) => <CreateTeamTagForm onClose={onClose} />}
            editForm={(onClose, id) => (
                <EditTeamTagForm onClose={onClose} id={id} />
            )}
            archivable
        />
    );
};
