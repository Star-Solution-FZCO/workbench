import { DataGridPro, GridColDef, GridToolbar } from "@mui/x-data-grid-pro";
import { nanoid } from "@reduxjs/toolkit";
import { Employee } from "_components";
import { reportsApi } from "_redux";
import { useMemo } from "react";
import { VacationReportT } from "types";
import ReportWrapper from "./components/report_wrapper";

const VacationFreeDaysReport = () => {
    const [getVacationFreeDaysReport, { data, isLoading, isFetching }] =
        reportsApi.useLazyGetVacationFreeDaysReportQuery();

    const columns = useMemo<GridColDef<VacationReportT>[]>(
        () => [
            {
                field: "employee",
                headerName: "Name",
                flex: 1,
                renderCell: ({ row }) => <Employee employee={row.employee} />,
            },
            {
                field: "total_vacation_days_year_end",
                headerName: "Total vacation days year end",
                flex: 1,
                valueGetter: (_, row) => row.item.total_vacation_days_year_end,
            },
            {
                field: "total_vacation_days_current",
                headerName: "Total vacation days current",
                flex: 1,
                valueGetter: (_, row) => row.item.total_vacation_days_current,
            },
            {
                field: "count_existed_vacations",
                headerName: "Count existed vacations",
                flex: 1,
                valueGetter: (_, row) => row.item.count_existed_vacations,
            },
            {
                field: "count_correction",
                headerName: "Count correction",
                flex: 1,
                valueGetter: (_, row) => row.item.count_correction,
            },
            {
                field: "free_vacation_days_year_end",
                headerName: "Free vacation days year end",
                flex: 1,
                valueGetter: (_, row) => row.item.free_vacation_days_year_end,
            },
            {
                field: "free_vacation_days_current",
                headerName: "Free vacation days current",
                flex: 1,
                valueGetter: (_, row) => row.item.free_vacation_days_current,
            },
            {
                field: "count_existed_sick_days",
                headerName: "Count existed sick days",
                flex: 1,
                valueGetter: (_, row) => row.item.count_existed_sick_days,
            },
        ],
        [],
    );

    return (
        <ReportWrapper
            reportType="vacation-free-days-report"
            queryFn={getVacationFreeDaysReport}
            isLoading={isLoading}
        >
            <DataGridPro
                slots={{ toolbar: GridToolbar }}
                columns={columns}
                rows={data?.payload?.items || []}
                getRowId={() => nanoid()}
                density="compact"
                loading={isFetching}
            />
        </ReportWrapper>
    );
};

export default VacationFreeDaysReport;
