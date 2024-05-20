import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LinkIcon from "@mui/icons-material/Link";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    FormControlLabel,
    IconButton,
    Switch,
    Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import {
    ActivitySourceFilter,
    GroupFilter,
    ListStateT,
    ReportTableWidthSwitch,
    initialListState,
} from "_components";
import { reportsApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { format } from "date-fns";
import { FC, memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ReportTypeT, SelectOptionT } from "types";
import { toastError } from "utils";
import { ActivityColumnFilter } from "./activity/column_filter/column_filter";
import { DateShortcuts } from "./date_shortcuts";
import { IssuesSettings } from "./issues_settings";
import Legend from "./legend";
import { ReportTypeSelect } from "./report_type_select";

interface IReportControlsProps {
    startDate: Date | null;
    setStartDate: React.Dispatch<React.SetStateAction<Date | null>>;
    endDate: Date | null;
    setEndDate: React.Dispatch<React.SetStateAction<Date | null>>;
    activitySourceList: SelectOptionT[];
    setActivitySourceList: React.Dispatch<
        React.SetStateAction<SelectOptionT[]>
    >;
    reportType: ReportTypeT;
    setReportType: React.Dispatch<React.SetStateAction<ReportTypeT>>;
    idList: Array<string | number>;
    onChangeIdList: (idList: Array<string | number>) => void;
    teamId: string | null;
    showCopyLink?: boolean;
    showBackButton?: boolean;
    showLegend?: boolean;
    showColumnWidthSwitch?: boolean;
    main?: boolean;
    onlySelected?: boolean;
    onChangeOnlySelected?: (selected: boolean) => void;
    onlyResolved: boolean;
    onChangeOnlyResolved: (selected: boolean) => void;
    onGenerate: () => void;
}

const ReportControls: FC<IReportControlsProps> = memo(
    ({
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        activitySourceList,
        setActivitySourceList,
        reportType,
        setReportType,
        idList,
        onChangeIdList,
        teamId,
        showCopyLink,
        showBackButton,
        showLegend,
        showColumnWidthSwitch,
        main,
        onlySelected,
        onChangeOnlySelected,
        onlyResolved,
        onChangeOnlyResolved,
        onGenerate,
    }) => {
        const navigate = useNavigate();

        const [
            getVacationFreeDaysReportCSV,
            getVacationFreeDaysReportCSVProps,
        ] = reportsApi.useLazyGetVacationFreeDaysReportCSVQuery();

        const [getActivitySummaryReportCSV, getActivitySummaryReportCSVProps] =
            reportsApi.useLazyGetActivitySummaryReportCSVQuery();
        const [getActivityDetailsReportCSV, getActivityDetailsReportCSVProps] =
            reportsApi.useLazyGetActivityDetailsReportCSVQuery();
        const [
            getActivitySummaryTotalReportCSV,
            getActivitySummaryTotalReportCSVProps,
        ] = reportsApi.useLazyGetActivitySummaryTotalReportCSVQuery();

        const [getPresenceSummaryReportCSV, getPresenceSummaryReportCSVProps] =
            reportsApi.useLazyGetPresenceSummaryReportCSVQuery();
        const [getPresenceDetailsReportCSV, getPresenceDetailsReportCSVProps] =
            reportsApi.useLazyGetPresenceDetailsReportCSVQuery();

        const [getDayOffSummaryReportCSV, getDayOffSummaryReportCSVProps] =
            reportsApi.useLazyGetDayOffSummaryReportCSVQuery();
        const [getDayOffDetailsReportCSV, getDayOffDetailsReportCSVProps] =
            reportsApi.useLazyGetDayOffDetailsReportCSVQuery();

        const [getDueDateReportCSV, getDueDateReportCSVProps] =
            reportsApi.useLazyGetDueDateReportCSVQuery();

        const [
            getDoneTasksSummaryReportCSV,
            getDoneTasksSummaryReportCSVProps,
        ] = reportsApi.useLazyGetDoneTasksSummaryReportCSVQuery();

        const [
            getDoneTasksSummaryTotalReportCSV,
            getDoneTasksSummaryTotalReportCSVProps,
        ] = reportsApi.useLazyGetDoneTasksSummaryTotalReportCSVQuery();

        const copyLink = async () => {
            let link = window.location.href;

            if (window.location.pathname.startsWith("/my-")) {
                link = link.replace("my-", "");
            }

            await navigator.clipboard.writeText(link);
            toast.success("Link was successfully copied to the clipboard");
        };

        const exportReport = () => {
            if (!startDate || !endDate) return;
            if (reportType === "calendar-report") return;

            let getReportCSVTrigger = null;

            const getReportCSVMutationMap: Record<ReportTypeT, any> = {
                "vacation-free-days-report": getVacationFreeDaysReportCSV,
                "activity-summary-report": getActivitySummaryReportCSV,
                "activity-details-report": getActivityDetailsReportCSV,
                "activity-summary-total-report":
                    getActivitySummaryTotalReportCSV,
                presence: getPresenceDetailsReportCSV,
                "presence-summary-report": getPresenceSummaryReportCSV,
                "day-off-summary-report": getDayOffSummaryReportCSV,
                "day-off-details-report": getDayOffDetailsReportCSV,
                "calendar-report": undefined,
                "due-date-report": getDueDateReportCSV,
                "done-tasks-summary-report": getDoneTasksSummaryReportCSV,
                "done-tasks-summary-total-report":
                    getDoneTasksSummaryTotalReportCSV,
            };

            const params: Partial<ListStateT & { start: string; end: string }> =
                {
                    filter: {
                        ...(idList.length > 0 && {
                            id: `id___in:${idList.join(",")}`,
                        }),
                        ...(teamId && { team: `team_id:${teamId}` }),
                    },
                };

            if (reportType !== "vacation-free-days-report") {
                params["start"] = format(startDate, "yyyy-MM-dd");
                params["end"] = format(endDate, "yyyy-MM-dd");
            }

            getReportCSVTrigger = getReportCSVMutationMap[reportType];

            if (getReportCSVTrigger === null) return;

            getReportCSVTrigger(
                makeListParams(
                    {
                        ...initialListState,
                        ...params,
                    },
                    [],
                ),
            )
                .unwrap()
                .catch((error: any) => {
                    toastError(error);
                });
        };

        const setRange = (start: Date, end: Date) => {
            setStartDate(start);
            setEndDate(end);
        };

        const buttonsDisabled = !startDate || !endDate;

        const reportLoading =
            getVacationFreeDaysReportCSVProps.isLoading ||
            getActivitySummaryReportCSVProps.isLoading ||
            getActivityDetailsReportCSVProps.isLoading ||
            getActivitySummaryTotalReportCSVProps.isLoading ||
            getPresenceSummaryReportCSVProps.isLoading ||
            getPresenceDetailsReportCSVProps.isLoading ||
            getDayOffSummaryReportCSVProps.isLoading ||
            getDayOffDetailsReportCSVProps.isLoading ||
            getDueDateReportCSVProps.isLoading ||
            getDoneTasksSummaryReportCSVProps.isLoading ||
            getDoneTasksSummaryTotalReportCSVProps.isLoading;

        useEffect(() => {
            const keyDownHandler = (event: KeyboardEvent) => {
                if (event.key === "Enter") {
                    event.preventDefault();

                    if (!buttonsDisabled) {
                        onGenerate();
                    }
                }
            };

            document.addEventListener("keydown", keyDownHandler);

            return () => {
                document.removeEventListener("keydown", keyDownHandler);
            };
        }, [buttonsDisabled, onGenerate]);

        useEffect(() => {
            if (reportType !== "activity-details-report") {
                onChangeOnlyResolved(false);
            }
        }, [onChangeOnlyResolved, reportType]);

        return (
            <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" alignItems="center" gap={1}>
                    {showBackButton && (
                        <IconButton onClick={() => navigate(-1)}>
                            <ArrowBackIcon />
                        </IconButton>
                    )}

                    {reportType !== "vacation-free-days-report" && (
                        <Box
                            className="reports-datepickers"
                            display="flex"
                            gap={1}
                        >
                            <DatePicker
                                label="From"
                                value={startDate}
                                onChange={(value: Date | null) =>
                                    setStartDate(value)
                                }
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        sx: { width: "180px" },
                                    },
                                }}
                            />

                            <DatePicker
                                label="To"
                                value={endDate}
                                onChange={(value: Date | null) =>
                                    setEndDate(value)
                                }
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        sx: { width: "180px" },
                                    },
                                }}
                            />
                        </Box>
                    )}

                    <ReportTypeSelect
                        value={reportType}
                        onChange={(event) =>
                            setReportType(event.target.value as ReportTypeT)
                        }
                    />

                    {[
                        "activity-summary-report",
                        "activity-summary-total-report",
                    ].includes(reportType) && <ActivityColumnFilter />}

                    {reportType === "activity-details-report" && (
                        <ActivitySourceFilter
                            value={activitySourceList}
                            onChange={(value) => setActivitySourceList(value)}
                        />
                    )}

                    {main && (
                        <GroupFilter
                            idList={idList}
                            onChangeIdList={onChangeIdList}
                        />
                    )}

                    <Tooltip
                        title='You can also generate a report by pressing the "Enter"'
                        placement="top"
                    >
                        <Button
                            className="reports-generate-button"
                            onClick={onGenerate}
                            variant="outlined"
                            size="small"
                            disabled={buttonsDisabled}
                        >
                            Generate
                        </Button>
                    </Tooltip>

                    {showCopyLink && (
                        <Tooltip
                            title="Copy link to this report"
                            placement="top"
                        >
                            <Button
                                onClick={copyLink}
                                variant="outlined"
                                color="info"
                                size="small"
                            >
                                <LinkIcon />
                            </Button>
                        </Tooltip>
                    )}

                    {reportType !== "calendar-report" && (
                        <Tooltip title=" Export CSV" placement="top">
                            <LoadingButton
                                className="reports-export-button"
                                onClick={exportReport}
                                variant="outlined"
                                color="secondary"
                                size="small"
                                disabled={buttonsDisabled}
                                loading={reportLoading}
                            >
                                <SummarizeIcon />
                            </LoadingButton>
                        </Tooltip>
                    )}

                    {showColumnWidthSwitch &&
                        reportType !== "vacation-free-days-report" && (
                            <ReportTableWidthSwitch />
                        )}

                    {showLegend && <Legend />}

                    <IssuesSettings />
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                    {reportType !== "vacation-free-days-report" && (
                        <DateShortcuts setRange={setRange} />
                    )}

                    {main && idList.length > 0 && (
                        <FormControlLabel
                            sx={{ ml: 1 }}
                            control={
                                <Switch
                                    size="small"
                                    checked={onlySelected}
                                    onChange={(e) => {
                                        onChangeOnlySelected &&
                                            onChangeOnlySelected(
                                                e.target.checked,
                                            );
                                    }}
                                />
                            }
                            label="Show only selected"
                        />
                    )}

                    {reportType === "activity-details-report" && (
                        <FormControlLabel
                            sx={{ ml: 1 }}
                            control={
                                <Switch
                                    size="small"
                                    checked={onlyResolved}
                                    onChange={(e) =>
                                        onChangeOnlyResolved(e.target.checked)
                                    }
                                />
                            }
                            label="Only resolved YouTrack issues"
                        />
                    )}
                </Box>
            </Box>
        );
    },
);

export { ReportControls };
