import {
    Box,
    Button,
    Collapse,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
} from "@mui/material";
import { ListStateT, ReduxSelect, SelectPlaceholder } from "_components";
import { employeesApi } from "_redux";
import { isEmpty, omit } from "lodash";
import { FC, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CounterAgentStatusFilterT } from "types";

const filterValueMap: Record<string, string> = {
    team: "team_id",
    manager: "manager_id",
    parent: "parent_id",
};

interface ICounteragentListFilter {
    showFilter: boolean;
    listState: ListStateT;
    setListState: React.Dispatch<React.SetStateAction<ListStateT>>;
}

const CounteragentListFilter: FC<ICounteragentListFilter> = ({
    showFilter,
    listState,
    setListState,
}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [statusFilter, setStatusFilter] =
        useState<CounterAgentStatusFilterT>("valid");

    const handleChangeFilter = (
        newValue: any,
        key: string,
        filterValue: string,
        name?: string,
    ) => {
        const k = name || key;

        if (!newValue) {
            setSearchParams((prevSearchParams) => {
                return omit(Object.fromEntries(prevSearchParams.entries()), k);
            });
            setListState({
                ...listState,
                filter: omit(listState.filter, k),
            });
        } else {
            setSearchParams((prevSearchParams) => ({
                ...Object.fromEntries(prevSearchParams.entries()),
                [k]: newValue.value,
            }));
            setListState({
                ...listState,
                filter: {
                    ...listState.filter,
                    [k]: `${filterValue}:${newValue.value}`,
                },
            });
        }
    };

    const handleChangeStatus = (
        e: SelectChangeEvent<CounterAgentStatusFilterT>,
    ) => {
        const value = e.target.value;
        setStatusFilter(value as CounterAgentStatusFilterT);

        if (value === "all") {
            setListState({
                ...listState,
                filter: omit(listState.filter, "status"),
            });
            return;
        }

        const status = `status:${value.toUpperCase()}`;

        setListState({
            ...listState,
            filter: {
                ...listState.filter,
                status,
            },
        });
    };

    const resetListState = () => {
        setListState({
            ...listState,
            filter: { status: "status:VALID" },
        });
    };

    const resetFilter = () => {
        setStatusFilter("valid");
        setSearchParams({});
        resetListState();
    };

    useEffect(() => {
        const newFilters: Record<string, string> = {};

        for (const [key, value] of searchParams.entries()) {
            newFilters[key] = `${filterValueMap[key]}:${value}`;
        }

        setListState({
            ...listState,
            filter: {
                ...listState.filter,
                ...newFilters,
            },
        });

        if (isEmpty(Object.fromEntries(searchParams.entries()))) {
            resetListState();
        }
    }, [searchParams, setListState]);

    return (
        <Collapse
            in={showFilter}
            sx={{
                minHeight: "unset !important",
            }}
        >
            <Box
                className="people-list-filter"
                display="flex"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
            >
                <Box width="200px">
                    <ReduxSelect
                        name="team"
                        label="Team"
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        placeholder={<SelectPlaceholder />}
                        optionsLoadFn={employeesApi.useListTeamSelectQuery}
                        onChange={(newValue) =>
                            handleChangeFilter(newValue, "team", "team_id")
                        }
                        filterOption={() => true}
                        isClearable
                        emptyOption
                    />
                </Box>

                <Box width="200px">
                    <ReduxSelect
                        name="manager"
                        label="Manager"
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        placeholder={<SelectPlaceholder />}
                        optionsLoadFn={employeesApi.useListEmployeeSelectQuery}
                        onChange={(newValue) =>
                            handleChangeFilter(
                                newValue,
                                "manager",
                                "manager_id",
                            )
                        }
                        isClearable
                        emptyOption
                    />
                </Box>

                <Box width="200px">
                    <ReduxSelect
                        name="parent"
                        label="Parent"
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        placeholder={<SelectPlaceholder />}
                        optionsLoadFn={
                            employeesApi.useListCounteragentSelectQuery
                        }
                        onChange={(newValue) =>
                            handleChangeFilter(newValue, "parent", "parent_id")
                        }
                        filterOption={() => true}
                        isClearable
                        emptyOption
                    />
                </Box>

                <FormControl>
                    <InputLabel>Status</InputLabel>
                    <Select
                        sx={{ width: "120px" }}
                        value={statusFilter}
                        onChange={handleChangeStatus}
                        label="Status"
                        size="small"
                    >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="valid">Valid</MenuItem>
                        <MenuItem value="invalid">Invalid</MenuItem>
                        <MenuItem value="suspended">Suspended</MenuItem>
                    </Select>
                </FormControl>

                <Button
                    onClick={resetFilter}
                    variant="outlined"
                    color="secondary"
                    size="small"
                >
                    Reset
                </Button>
            </Box>
        </Collapse>
    );
};

export { CounteragentListFilter };
