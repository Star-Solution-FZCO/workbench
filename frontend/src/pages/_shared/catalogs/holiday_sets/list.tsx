import { GridColDef, GridEventListener } from "@mui/x-data-grid";
import { Title } from "_components";
import { catalogsApi, useAppSelector } from "_redux";
import { useMatch, useNavigate } from "react-router-dom";
import { HolidaySetT } from "types/models";
import { CatalogListView } from "../components";
import { CreateHolidaySetForm, EditHolidaySetFormWrapper } from "./form";

export const HolidaySetList = () => {
    const navigate = useNavigate();
    const isProductionCalendarPage = useMatch("/production-calendar");

    const profile = useAppSelector((state) => state.profile.payload);

    const columns: GridColDef<HolidaySetT>[] = [
        { field: "name", headerName: "Name", flex: 1 },
        { field: "description", headerName: "Description", flex: 1 },
    ];

    const handleRowClick: GridEventListener<"rowClick"> = (params) => {
        navigate(`view/${params.row.id}`);
    };

    return (
        <>
            {isProductionCalendarPage && <Title title="Production Calendar" />}

            <CatalogListView
                entityName="Holiday set"
                dataQueryFn={catalogsApi.useListHolidaySetQuery}
                getEntityQueryFn={catalogsApi.useGetHolidaySetQuery}
                columns={columns}
                createForm={(onClose) => (
                    <CreateHolidaySetForm onClose={onClose} />
                )}
                editForm={(onClose, id) => (
                    <EditHolidaySetFormWrapper onClose={onClose} id={id} />
                )}
                onRowClick={handleRowClick}
                hasDefault
                setDefaultMutation={catalogsApi.useSetDefaultHolidaySetMutation}
                disableEdit={!profile.hr && !profile.admin}
            />
        </>
    );
};
