import { GridColDef } from "@mui/x-data-grid";
import { catalogsApi } from "_redux";
import { GradeT } from "types/models";
import { CatalogListView } from "../components";
import { CreateGradeForm, EditGradeForm } from "./form";

export const GradeList = () => {
    const columns: GridColDef<GradeT>[] = [
        { field: "name", headerName: "Name", flex: 1 },
        { field: "description", headerName: "Description", flex: 1 },
    ];

    return (
        <CatalogListView
            entityName="Grade"
            dataQueryFn={catalogsApi.useListGradeQuery}
            getEntityQueryFn={catalogsApi.useGetGradeQuery}
            columns={columns}
            createForm={(onClose) => <CreateGradeForm onClose={onClose} />}
            editForm={(onClose, id) => (
                <EditGradeForm onClose={onClose} id={id} />
            )}
        />
    );
};
