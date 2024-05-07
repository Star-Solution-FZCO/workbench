import { GridColDef } from "@mui/x-data-grid";
import { catalogsApi } from "_redux";
import { PositionT } from "types/models";
import { CatalogListView } from "../components";
import { CreatePositionForm, EditPositionForm } from "./form";

export const PositionList = () => {
    const columns: GridColDef<PositionT>[] = [
        { field: "name", headerName: "Name", flex: 1 },
        {
            field: "category",
            headerName: "Category",
            valueGetter: (_, row) => row.category?.label,
            flex: 1,
        },
    ];

    return (
        <CatalogListView
            entityName="Position"
            dataQueryFn={catalogsApi.useListPositionQuery}
            getEntityQueryFn={catalogsApi.useGetPositionQuery}
            archiveMutation={catalogsApi.useArchivePositionMutation}
            restoreMutation={catalogsApi.useRestorePositionMutation}
            columns={columns}
            createForm={(onClose) => <CreatePositionForm onClose={onClose} />}
            editForm={(onClose, id) => (
                <EditPositionForm onClose={onClose} id={id} />
            )}
            archivable
        />
    );
};
