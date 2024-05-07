import ArrowBack from "@mui/icons-material/ArrowBack";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    IconButton,
    LinearProgress,
    Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers-pro";
import {
    ListStateT,
    ReportTableWidthSwitch,
    initialListState,
} from "_components";
import { DateShortcuts } from "_components/reports/date_shortcuts";
import { reportsApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { toastError } from "utils";
import { TeamMembersReportList } from "./components";

const TeamMembersReport = () => {
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const idList = searchParams.getAll("id");

    const listState: ListStateT = useMemo(
        () => ({
            ...initialListState,
            filter: {
                ...(idList.length > 0 && { id: `id___in:${idList.join(",")}` }),
            },
        }),
        [idList],
    );

    const [startDate, setStartDate] = useState<Date | null>(
        start ? new Date(start) : null,
    );
    const [endDate, setEndDate] = useState<Date | null>(
        end ? new Date(end) : null,
    );

    const [getTeamMembersReport, { data, isLoading, isFetching }] =
        reportsApi.useLazyGetTeamMembersReportQuery();

    const [getTeamMembersReportCSV, getTeamMembersReportCSVProps] =
        reportsApi.useLazyGetTeamMembersReportCSVQuery();

    const exportReport = () => {
        if (!startDate || !endDate) return;
        const params: Partial<ListStateT> = {
            filter: {
                ...(idList.length > 0 && {
                    id: `id___in:${idList.join(",")}`,
                }),
            },
        };

        getTeamMembersReportCSV({
            ...makeListParams(
                {
                    ...initialListState,
                    ...params,
                },
                [],
            ),
            start: format(startDate, "yyyy-MM-dd"),
            end: format(endDate, "yyyy-MM-dd"),
        })
            .unwrap()
            .catch((error: any) => {
                toastError(error);
            });
    };

    const setRange = (start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
    };

    const copyLink = async () => {
        const link = window.location.href;
        await navigator.clipboard.writeText(link);
        toast.success("Link was successfully copied to the clipboard");
    };

    const fetchReport = () => {
        const params: any = {
            ...makeListParams(listState, []),
            start: startDate ? format(startDate, "yyyy-MM-dd") : start,
            end: endDate ? format(endDate, "yyyy-MM-dd") : end,
        };

        getTeamMembersReport(params)
            .unwrap()
            .catch((error: any) => {
                toastError(error);
            });
    };

    const generate = () => {
        if (!startDate || !endDate) return;

        const params: any = {
            ...(idList.length > 0 && { id: idList }),
            start: format(startDate, "yyyy-MM-dd"),
            end: format(endDate, "yyyy-MM-dd"),
        };

        setSearchParams(params);
        fetchReport();
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const buttonsDisabled = !startDate || !endDate;

    if (isLoading || isFetching) return <LinearProgress />;

    return (
        <Box display="flex" flexDirection="column" height="100%" gap={2}>
            <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" gap={1}>
                    <IconButton onClick={() => navigate("/teams/reports")}>
                        <ArrowBack />
                    </IconButton>

                    <DatePicker
                        value={startDate}
                        onChange={(value: Date | null) => setStartDate(value)}
                        slotProps={{
                            textField: {
                                size: "small",
                                sx: { width: "180px" },
                            },
                        }}
                    />

                    <DatePicker
                        value={endDate}
                        onChange={(value: Date | null) => setEndDate(value)}
                        slotProps={{
                            textField: {
                                size: "small",
                                sx: { width: "180px" },
                            },
                        }}
                    />

                    <Tooltip
                        title='You can also generate a report by pressing the "Enter"'
                        placement="top"
                    >
                        <Button
                            onClick={generate}
                            variant="outlined"
                            size="small"
                            disabled={buttonsDisabled}
                        >
                            Generate
                        </Button>
                    </Tooltip>

                    <Tooltip title="Copy link to this report" placement="top">
                        <Button
                            onClick={copyLink}
                            variant="outlined"
                            color="info"
                            size="small"
                        >
                            <ContentPasteIcon />
                        </Button>
                    </Tooltip>
                    <Tooltip title=" Export CSV" placement="top">
                        <LoadingButton
                            className="reports-export-button"
                            onClick={exportReport}
                            variant="outlined"
                            color="secondary"
                            size="small"
                            disabled={buttonsDisabled}
                            loading={getTeamMembersReportCSVProps.isLoading}
                        >
                            <SummarizeIcon />
                        </LoadingButton>
                    </Tooltip>
                    <ReportTableWidthSwitch />
                </Box>

                <DateShortcuts setRange={setRange} />
            </Box>

            <TeamMembersReportList data={data?.payload?.items || []} />
        </Box>
    );
};

export default TeamMembersReport;
