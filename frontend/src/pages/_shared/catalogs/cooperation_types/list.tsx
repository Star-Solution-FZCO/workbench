import { GridColDef } from "@mui/x-data-grid";
import { catalogsApi } from "_redux";
import { CooperationTypeT } from "types/models";
import { CatalogListView } from "../components";
import { CreateCooperationTypeForm, EditCooperationTypeForm } from "./form";

export const CooperationTypeList = () => {
    const columns: GridColDef<CooperationTypeT>[] = [
        { field: "name", headerName: "Name", flex: 1 },
    ];

    return (
        <CatalogListView
            entityName="Cooperation type"
            dataQueryFn={catalogsApi.useListCooperationTypeQuery}
            getEntityQueryFn={catalogsApi.useGetCooperationTypeQuery}
            archiveMutation={catalogsApi.useArchiveCooperationTypeMutation}
            restoreMutation={catalogsApi.useRestoreCooperationTypeMutation}
            columns={columns}
            createForm={(onClose) => (
                <CreateCooperationTypeForm onClose={onClose} />
            )}
            editForm={(onClose, id) => (
                <EditCooperationTypeForm onClose={onClose} id={id} />
            )}
            archivable
        />
    );
};
