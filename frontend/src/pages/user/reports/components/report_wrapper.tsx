import { Box, LinearProgress } from "@mui/material";
import { ListStateT, ReportControls, initialListState } from "_components";
import { reportsApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { format } from "date-fns";
import { FC, memo, useCallback, useEffect, useMemo, useState } from "react";
import {
    createSearchParams,
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import { ReportTypeT, SelectOptionT } from "types";
import { toastError } from "utils";
import { generateReportWarningMessage, reportPathMap } from "../utils";

interface IReportWrapperProps extends React.PropsWithChildren {
    reportType: ReportTypeT;
    isLoading?: boolean;
    isFetching?: boolean;
    queryFn: any;
    ioEntry?: IntersectionObserverEntry;
    page?: number;
    onIntersect?: () => void;
}

const ReportWrapper: FC<IReportWrapperProps> = memo(
    ({
        children,
        reportType: initialReportType,
        isLoading,
        isFetching,
        queryFn,
        ioEntry,
        page,
        onIntersect,
    }) => {
        const navigate = useNavigate();
        const [searchParams, setSearchParams] = useSearchParams();

        const { data: options } = reportsApi.useListActivitySourceQuery("");

        const startDateParam = searchParams.get("start");
        const endDateParam = searchParams.get("end");
        const idList = searchParams.getAll("id");
        const sourceParam = searchParams.get("source");
        const teamIdParam = searchParams.get("team");
        const youtrackOnlyResolvedParam = searchParams.get(
            "youtrack_only_resolved",
        );

        const listState: ListStateT = useMemo(
            () => ({
                ...initialListState,
                filter: {
                    ...(idList.length > 0 && {
                        id: `id___in:${idList.join(",")}`,
                    }),
                    ...(teamIdParam && { team: `team_id:${teamIdParam}` }),
                },
                offset: page
                    ? initialListState.limit * (page - 1)
                    : initialListState.offset,
            }),
            [idList, page, teamIdParam],
        );

        const [startDate, setStartDate] = useState<Date | null>(
            startDateParam ? new Date(startDateParam) : null,
        );
        const [endDate, setEndDate] = useState<Date | null>(
            endDateParam ? new Date(endDateParam) : null,
        );
        const [activitySourceList, setActivitySourceList] = useState<
            SelectOptionT[]
        >([]);
        const [reportType, setReportType] =
            useState<ReportTypeT>(initialReportType);
        const [youtrackOnlyResolved, setYoutrackOnlyResolved] = useState(
            Boolean(youtrackOnlyResolvedParam),
        );

        const handleChangeIdList = (idList: Array<number | string>) => {
            setSearchParams((prev) => {
                if (idList.length > 0) {
                    return {
                        ...prev,
                        id: idList.join(","),
                    };
                } else {
                    return prev;
                }
            });
        };

        const handleOnlyResolved = useCallback(
            (selected: boolean) => {
                setYoutrackOnlyResolved(selected);

                const param = "youtrack_only_resolved";

                if (selected && !searchParams.has("youtrack_only_resolved")) {
                    searchParams.set(param, "true");
                } else {
                    searchParams.delete(param);
                }

                setSearchParams(searchParams);
            },
            [searchParams, setSearchParams],
        );

        const fetchReport = useCallback(
            (start?: string, end?: string) => {
                let activity_filter = "";

                if (sourceParam && activitySourceList.length === 0) {
                    activity_filter = `source_id___in:${sourceParam}`;
                }

                if (activitySourceList.length > 0) {
                    activity_filter = `source_id___in:${activitySourceList
                        .map((item) => item.value)
                        .join(",")}`;
                }

                if (youtrackOnlyResolved) {
                    activity_filter += `${
                        activity_filter.length > 0 ? " and " : ""
                    }action:CLOSED or action:RESOLVED or action:DONE`;
                }

                const params: any = {
                    ...makeListParams(listState, []),
                    ...(activity_filter.length > 0 && { activity_filter }),
                };

                if (start) params["start"] = start;
                if (end) params["end"] = end;

                queryFn(params, true)
                    .unwrap()
                    .catch((error: any) => {
                        toastError(error);
                    });
            },
            [
                activitySourceList,
                listState,
                queryFn,
                sourceParam,
                youtrackOnlyResolved,
            ],
        );

        const generate = () => {
            if (!startDate || !endDate) return;

            if (idList.length === 0 && !teamIdParam) {
                const confirmed = confirm(generateReportWarningMessage);
                if (!confirmed) return;
            }

            const params: any = {
                ...(idList.length > 0 && { id: idList }),
                ...(teamIdParam && { team: teamIdParam }),
                ...(activitySourceList.length > 0 && {
                    source: activitySourceList
                        .map((item) => item.value)
                        .join(","),
                }),
                ...(youtrackOnlyResolved && {
                    youtrack_only_resolved: true,
                }),
            };

            if (reportType !== "vacation-free-days-report") {
                params["start"] = format(startDate, "yyyy-MM-dd");
                params["end"] = format(endDate, "yyyy-MM-dd");
            }

            if (reportType !== initialReportType) {
                navigate(
                    {
                        pathname: "/reports/" + reportPathMap[reportType],
                        search: createSearchParams(params).toString(),
                    },
                    {
                        replace: true,
                    },
                );
            } else {
                setSearchParams(params);
                fetchReport(params["start"], params["end"]);
            }
        };

        useEffect(() => {
            if (
                reportType !== "vacation-free-days-report" &&
                startDateParam &&
                endDateParam
            ) {
                fetchReport(startDateParam, endDateParam);
            } else {
                fetchReport();
            }
        }, []);

        useEffect(() => {
            if (
                ioEntry?.isIntersecting &&
                onIntersect &&
                startDateParam &&
                endDateParam
            ) {
                onIntersect();
                fetchReport(startDateParam, endDateParam);
            }
        }, [ioEntry]);

        useEffect(() => {
            if (options && sourceParam) {
                const sourceListFromQueryParams: SelectOptionT[] =
                    options.filter((item) =>
                        sourceParam.includes(item.value.toString()),
                    );
                setActivitySourceList(sourceListFromQueryParams);
            }
        }, [options]);

        if (isLoading || isFetching) return <LinearProgress />;

        return (
            <Box display="flex" flexDirection="column" height="100%" gap={2}>
                <ReportControls
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    activitySourceList={activitySourceList}
                    setActivitySourceList={setActivitySourceList}
                    reportType={reportType}
                    setReportType={setReportType}
                    idList={idList}
                    onChangeIdList={handleChangeIdList}
                    teamId={teamIdParam}
                    onGenerate={generate}
                    onlyResolved={youtrackOnlyResolved}
                    onChangeOnlyResolved={handleOnlyResolved}
                    showBackButton
                    showCopyLink
                    showLegend
                    showColumnWidthSwitch
                />

                {children}
            </Box>
        );
    },
);

export default ReportWrapper;
