import { GridColDef } from "@mui/x-data-grid";
import { catalogsApi } from "_redux";
import { EmployeePoolT } from "types/models";
import { CatalogListView } from "../components";
import { CreateEmployeePoolForm, EditEmployeePoolForm } from "./form";

export const EmployeePoolList = () => {
    const columns: GridColDef<EmployeePoolT>[] = [
        { field: "name", headerName: "Name", flex: 1 },
    ];

    return (
        <CatalogListView
            entityName="Pool"
            dataQueryFn={catalogsApi.useListEmployeePoolQuery}
            getEntityQueryFn={catalogsApi.useGetEmployeePoolQuery}
            columns={columns}
            createForm={(onClose) => (
                <CreateEmployeePoolForm onClose={onClose} />
            )}
            editForm={(onClose, id) => (
                <EditEmployeePoolForm onClose={onClose} id={id} />
            )}
        />
    );
};
