import { Box, LinearProgress, Pagination } from "@mui/material";
import { ListStateT, SearchField, initialListState } from "_components";
import { sharedApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { debounce } from "lodash";
import { useCallback, useState } from "react";
import { calculatePageCount } from "utils";
import { ChangelogList as ChangelogListComponent, Menu } from "./components";

const changelogInitialiListState: ListStateT = {
    ...initialListState,
    limit: 10,
};

const ChangelogList = () => {
    const [page, setPage] = useState(1);
    const [listState, setListState] = useState(changelogInitialiListState);

    const { data, isLoading } = sharedApi.useListChangelogQuery(
        makeListParams(listState, ["name___icontains", "content___icontains"]),
    );

    const handleListStateChange = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (name: keyof ListStateT) => (value: any) => {
            setListState({
                ...listState,
                offset: name !== "search" ? listState.offset : 0,
                [name]: value,
            });
        },
        [listState],
    );

    const search = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleListStateChange("search")(event.target.value);
    };

    const handleChangeSearch = useCallback(debounce(search, 300), []);

    const handleChangePagination = (
        _: React.ChangeEvent<unknown>,
        page: number,
    ) => {
        setPage(page);
        handleListStateChange("offset")(listState.limit * (page - 1));
    };

    const count = calculatePageCount(listState.limit, data?.payload?.count);

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box display="flex" maxWidth="1200px" gap={1} flex={1}>
                <Box flex={3} display="flex" flexDirection="column" gap={1}>
                    <SearchField onChange={handleChangeSearch} />

                    {isLoading ? (
                        <LinearProgress />
                    ) : (
                        <ChangelogListComponent data={data} />
                    )}
                </Box>

                <Menu />
            </Box>

            {count > 1 && (
                <Box maxWidth="1200px">
                    <Pagination
                        page={page}
                        count={count}
                        onChange={handleChangePagination}
                    />
                </Box>
            )}
        </Box>
    );
};

export default ChangelogList;
