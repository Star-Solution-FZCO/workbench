import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import TodayIcon from "@mui/icons-material/Today";
import { LoadingButton } from "@mui/lab";
import { Box, Button, LinearProgress, Typography } from "@mui/material";
import { PresenceDetailsList, initialListState } from "_components";
import { reportsApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { FC, useEffect, useState } from "react";
import { toastError } from "utils";
import { formatDateHumanReadable } from "utils/convert";
import Legend from "./reports/legend";

interface IEmployeePresenceProps {
    id: number;
}

const EmployeePresence: FC<IEmployeePresenceProps> = ({ id }) => {
    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "GMT";
    const currentUserId = useAppSelector((state) => state.profile.payload.id);

    const [date, setDate] = useState<Date>(new Date());

    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });

    const { data: TMStatus } = reportsApi.useGetTMStatusQuery(
        {
            employee_id: id,
        },
        {
            pollingInterval: 15 * 1000,
        },
    );

    const { data: presenceDetails, isLoading } =
        reportsApi.useGetPresenceDetailsReportQuery({
            ...makeListParams(
                {
                    ...initialListState,
                    filter: {
                        id: `id___in:${id}`,
                    },
                },
                [],
            ),
            start: format(start, "yyyy-MM-dd"),
            end: format(end, "yyyy-MM-dd"),
        });

    const [setTMStatus, setTMStatusProps] = reportsApi.useSetTMStatusMutation();

    const [now, setNow] = useState(new Date());

    const handleChangeTMStatus = () => {
        setTMStatus({
            status: TMStatus?.payload?.status === "leave" ? "come" : "leave",
            source: "web",
        })
            .unwrap()
            .catch((error) => {
                toastError(error);
            });
    };

    const setWeek = (weeks?: number) => {
        if (!weeks) {
            setDate(new Date());
            return;
        }

        const d = new Date(date);
        d.setDate(date.getDate() + 7 * weeks);
        setDate(d);
    };

    const isLeave = TMStatus?.payload?.status === "leave";

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Typography fontSize={20} fontWeight={500}>
                Now: {formatInTimeZone(now, timezone, "dd MMM yyyy HH:mm:ss O")}
            </Typography>

            <Typography fontSize={20} fontWeight={500}>
                Status:{" "}
                <Typography
                    component="span"
                    fontSize="inherit"
                    color={isLeave ? "error" : "secondary"}
                    fontWeight={500}
                >
                    {isLeave ? "Absent" : "Work"}
                </Typography>
            </Typography>

            <Box display="flex" flexDirection="column" gap={1}>
                {id === currentUserId && (
                    <LoadingButton
                        variant="outlined"
                        sx={{ width: 200 }}
                        onClick={handleChangeTMStatus}
                        color={isLeave ? "success" : "error"}
                        startIcon={isLeave ? <LogoutIcon /> : <LoginIcon />}
                        loading={setTMStatusProps.isLoading}
                    >
                        {isLeave ? "Come" : "Leave"}
                    </LoadingButton>
                )}

                <Typography fontWeight={500}>
                    Presence details report from{" "}
                    {formatDateHumanReadable(start)} to{" "}
                    {formatDateHumanReadable(end)}
                </Typography>

                <Box display="flex" gap={1}>
                    <Button
                        onClick={() => setWeek(-1)}
                        variant="outlined"
                        size="small"
                        color="info"
                        startIcon={<ArrowBackIcon />}
                    >
                        Previous week
                    </Button>
                    <Button
                        onClick={() => setWeek()}
                        variant="outlined"
                        size="small"
                        color="info"
                        endIcon={<TodayIcon />}
                    >
                        Current week
                    </Button>
                    <Button
                        onClick={() => setWeek(1)}
                        variant="outlined"
                        size="small"
                        color="info"
                        endIcon={<ArrowForwardIcon />}
                    >
                        Next week
                    </Button>

                    <Legend />
                </Box>

                {isLoading ? (
                    <LinearProgress />
                ) : (
                    <PresenceDetailsList
                        presenceList={presenceDetails?.payload?.items || []}
                        hideEmployee
                        widthByContent
                    />
                )}
            </Box>
        </Box>
    );
};

export { EmployeePresence };
