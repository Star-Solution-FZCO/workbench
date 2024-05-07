import { Box, LinearProgress, Typography } from "@mui/material";
import {
    ActivitySummaryList,
    CalendarMonthTable,
    EmployeePresence,
    FreeVacationDays,
    Hints,
    ListStateT,
    SearchField,
    Title,
    UserInfo,
    initialListState,
} from "_components";
import {
    catalogsApi,
    employeesApi,
    reportsApi,
    scheduleApi,
    useAppSelector,
} from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { today, weekAgo } from "config";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { debounce } from "lodash";
import { FC, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { EmployeeT } from "types";
import { formatDateHumanReadable, formatDateYYYYMMDD } from "utils/convert";
import { UsefulList } from "./useful_links/components";

const monthRange = {
    start: formatDateYYYYMMDD(startOfMonth(today())),
    end: formatDateYYYYMMDD(endOfMonth(today())),
};

const startOfPreviousWeekAsDate = startOfWeek(weekAgo(), {
    weekStartsOn: 1,
});

const endOfCurrentWeekAsDate = endOfWeek(today(), {
    weekStartsOn: 1,
});

const startOfPreviousWeek = formatDateYYYYMMDD(startOfPreviousWeekAsDate);
const endOfCurrentWeek = formatDateYYYYMMDD(endOfCurrentWeekAsDate);

const ShortUserInfo: FC<{ profile: EmployeeT }> = ({ profile }) => {
    return (
        <Box>
            <Typography>
                <strong>Email:</strong> {profile.email}
            </Typography>
            <Typography>
                <strong>Pararam:</strong> {profile.pararam}
            </Typography>
            <Typography
                sx={{
                    "& a": {
                        color: "#0052cc",
                        textDecoration: "none",
                        "&:hover": {
                            textDecoration: "underline",
                        },
                    },
                }}
            >
                <strong>Team:</strong>{" "}
                <Link
                    to={`/teams/view/${
                        profile.team?.value
                    }/${profile.team?.label?.replaceAll(" ", "+")}`}
                >
                    {profile.team?.label}
                </Link>
            </Typography>
            {profile.position && (
                <Typography>
                    <strong>Position:</strong> {profile.position?.label}
                </Typography>
            )}
            {profile?.grade && (
                <Typography>
                    <strong>Grade:</strong> {profile.grade?.grade}
                </Typography>
            )}
        </Box>
    );
};

const Dashboard = () => {
    const profileId = useAppSelector((state) => state.profile.payload.id);

    const [listState, setListState] = useState<ListStateT>(initialListState);

    const { data: profile, isLoading: profileLoading } =
        employeesApi.useGetEmployeeQuery({
            id: profileId,
        });

    const {
        data: dayStatusItems,
        isLoading: dayStatusItemsLoading,
        isFetching: dayStatusItemsFetching,
    } = scheduleApi.useGetEmployeeDayStatusListQuery({
        id: profileId,
        ...monthRange,
    });

    const { data: report, isLoading: reportLoading } =
        reportsApi.useGetActivitySummaryReportQuery({
            filter: `id:${profileId}`,
            start: startOfPreviousWeek,
            end: endOfCurrentWeek,
        });

    const {
        data: links,
        isLoading: linksLoading,
        isFetching: linksFetching,
    } = catalogsApi.useListUsefulLinkQuery(
        makeListParams(listState, [
            "name___icontains",
            "link___icontains",
            "description___icontains",
        ]),
    );

    const handleListStateChange = useCallback(
        (name: keyof ListStateT) => (value: any) =>
            setListState({
                ...listState,
                [name]: value,
            }),
        [listState],
    );

    const search = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleListStateChange("search")(event.target.value);
    };

    const handleChangeSearch = useCallback(debounce(search, 300), []);

    if (
        profileLoading ||
        dayStatusItemsLoading ||
        reportLoading ||
        linksLoading
    )
        return <LinearProgress />;

    return (
        <Box display="flex" alignItems="flex-start" gap={1} height="100%">
            <Title title="Dashboard" />

            <Box display="flex" flexDirection="column" gap={1} flex={5}>
                <Box display="flex" gap={1}>
                    <Box display="flex" flexDirection="column" gap={1} flex={1}>
                        <Box
                            display="flex"
                            gap={2}
                            border="1px solid #ccc"
                            borderRadius={0.5}
                            p={1}
                        >
                            {profile && (
                                <>
                                    <UserInfo data={profile} hideControls />
                                    <ShortUserInfo profile={profile.payload} />
                                </>
                            )}
                        </Box>

                        <Box
                            flex={1}
                            display="flex"
                            flexDirection="column"
                            gap={1}
                            border="1px solid #ccc"
                            borderRadius={0.5}
                            p={1}
                        >
                            <FreeVacationDays
                                id={profileId}
                                hideAddCorrections
                            />

                            <Box display="flex" gap={1}>
                                <CalendarMonthTable
                                    year={today()}
                                    months={[today().getMonth()]}
                                    dayStatusMap={
                                        dayStatusItems?.payload?.dates
                                    }
                                    loading={
                                        dayStatusItemsLoading ||
                                        dayStatusItemsFetching
                                    }
                                />

                                <Hints showCurrentMonthHint />
                            </Box>
                        </Box>
                    </Box>

                    <Box
                        border="1px solid #ccc"
                        borderRadius={0.5}
                        p={1}
                        flex={1}
                    >
                        <EmployeePresence id={profileId} />
                    </Box>
                </Box>

                <Box display="flex" flexDirection="column">
                    <Typography fontWeight={500}>
                        My Activies report from{" "}
                        {formatDateHumanReadable(startOfPreviousWeekAsDate)} to{" "}
                        {formatDateHumanReadable(endOfCurrentWeekAsDate)}{" "}
                        (previous & current week)
                    </Typography>

                    <ActivitySummaryList
                        summaryList={report?.payload?.items || []}
                        hideEmployee
                    />
                </Box>
            </Box>

            <Box
                display="flex"
                flexDirection="column"
                gap={1}
                flex={1}
                position="sticky"
                top={0}
            >
                <SearchField
                    onChange={handleChangeSearch}
                    loading={linksFetching}
                />
                <UsefulList data={links} />
            </Box>
        </Box>
    );
};

export default Dashboard;
