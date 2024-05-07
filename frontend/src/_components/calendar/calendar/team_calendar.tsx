import { Box, TextField, Typography } from "@mui/material";
import { ListStateT, initialListState } from "_components";
import { scheduleApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { endOfYear, startOfYear } from "date-fns";
import { debounce } from "lodash";
import { FC, memo, useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import YearPicker from "../year_picker";
import CalendarTable from "./calendar_table";
import { Hints } from "./hints";
import { makeYearRange } from "./utils";

const limit = 20;

interface ITeamCalendarProps {
    id: number;
}

const TeamCalendar: FC<ITeamCalendarProps> = memo(({ id }) => {
    const [page, setPage] = useState(1);
    const [year, setYear] = useState<Date>(new Date());

    const [listState, setListState] = useState<ListStateT>({
        ...initialListState,
        limit,
        filter: { team: `team_id:${id}`, active: "active:true" },
    });

    const {
        data: responseData,
        isLoading,
        isFetching,
    } = scheduleApi.useGetDayStatusListQuery({
        ...makeYearRange(year),
        ...makeListParams(listState, ["english_name___icontains"]),
    });

    const { ref: loaderRef, entry } = useInView({
        threshold: 0,
    });

    const handleChangeYear = (value: Date | null) => {
        if (value === null) return;
        setYear(value);
    };

    const handleChangeTextfield = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setListState({
            ...listState,
            search: event.target.value || "",
        });
    };

    const searchByName = useCallback(debounce(handleChangeTextfield, 300), []);

    const count = responseData?.payload?.count || 0;
    const pageCount = Math.ceil(count / limit);

    const incrementPage = () => {
        if (isLoading) return;

        const p = page + 1;
        setPage(p);
        setListState({
            ...listState,
            offset: limit * (p - 1),
        });
    };

    useEffect(() => {
        if (entry?.isIntersecting) {
            incrementPage();
        }
    }, [entry]);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
            }}
        >
            <Typography fontSize={20} fontWeight={500}>
                Team calendar
            </Typography>

            <Box display="flex" justifyContent="space-between">
                <Box display="flex" flexDirection="column" gap="8px">
                    <YearPicker year={year} onChange={handleChangeYear} />

                    <TextField
                        label="Search by team member name"
                        onChange={searchByName}
                    />
                </Box>

                <Hints hideNumber alternativeToday />
            </Box>

            <Box maxHeight="473px">
                <CalendarTable
                    loaderRef={loaderRef}
                    data={responseData?.payload?.items}
                    start={startOfYear(year)}
                    end={endOfYear(year)}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    disableInfiniteScroll={
                        page === pageCount || !!listState.search
                    }
                />
            </Box>
        </Box>
    );
});

export { TeamCalendar };
