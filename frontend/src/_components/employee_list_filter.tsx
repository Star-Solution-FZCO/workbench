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
import { catalogsApi, employeesApi, useAppSelector } from "_redux";
import { isEmpty, omit } from "lodash";
import { FC, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StateFilterT } from "types";
import { ReduxSelect, SelectPlaceholder } from "./fields";
import { ListStateT } from "./views";

const filterValueMap: Record<string, string> = {
    team: "team_id",
    manager: "managers",
    position: "position_id",
    organization: "organization_id",
    cooperation_type: "cooperation_type_id",
    role: "roles",
    pool: "pool_id",
    holiday_set: "holiday_set_id",
};

interface IEmployeeListFilter {
    showFilter: boolean;
    listState: ListStateT;
    setListState: React.Dispatch<React.SetStateAction<ListStateT>>;
}

const EmployeeListFilter: FC<IEmployeeListFilter> = ({
    showFilter,
    listState,
    setListState,
}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const profile = useAppSelector(({ profile }) => profile.payload);

    const [employeeStateFilter, setEmployeeStateFilter] =
        useState<StateFilterT>("active");

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

    const handleChangeEmployeeState = (e: SelectChangeEvent<StateFilterT>) => {
        const value = e.target.value;
        setEmployeeStateFilter(value as StateFilterT);

        if (value === "all") {
            setListState({
                ...listState,
                filter: omit(listState.filter, "active"),
            });
            return;
        }

        const active = `active:${value === "active" ? "true" : "false"}`;

        setListState({
            ...listState,
            filter: {
                ...listState.filter,
                active,
            },
        });
    };

    const resetListState = () => {
        setListState({
            ...listState,
            filter: { active: "active:true" },
        });
    };

    const resetFilter = () => {
        setEmployeeStateFilter("active");
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
                                "employee",
                                "managers",
                                "manager",
                            )
                        }
                        isClearable
                        emptyOption
                    />
                </Box>

                <Box width="200px">
                    <ReduxSelect
                        name="position"
                        label="Position"
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        placeholder={<SelectPlaceholder />}
                        optionsLoadFn={catalogsApi.useListPositionSelectQuery}
                        onChange={(newValue) =>
                            handleChangeFilter(
                                newValue,
                                "position",
                                "position_id",
                            )
                        }
                        isClearable
                        emptyOption
                    />
                </Box>

                {["super_hr", "hr", "finance", "lawyer"].some((role) =>
                    profile.roles?.includes(role),
                ) && (
                    <>
                        <Box width="200px">
                            <ReduxSelect
                                name="organization"
                                label="Organization"
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                placeholder={<SelectPlaceholder />}
                                optionsLoadFn={
                                    catalogsApi.useListOrganizationSelectQuery
                                }
                                onChange={(newValue) =>
                                    handleChangeFilter(
                                        newValue,
                                        "organization",
                                        "organization_id",
                                    )
                                }
                                isClearable
                                emptyOption
                            />
                        </Box>

                        <Box width="200px">
                            <ReduxSelect
                                name="cooperation_type"
                                label="Cooperation type"
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                placeholder={<SelectPlaceholder />}
                                optionsLoadFn={
                                    catalogsApi.useListCooperationTypeSelectQuery
                                }
                                onChange={(newValue) =>
                                    handleChangeFilter(
                                        newValue,
                                        "cooperation_type",
                                        "cooperation_type_id",
                                    )
                                }
                                isClearable
                                emptyOption
                            />
                        </Box>
                    </>
                )}

                {profile.admin && (
                    <Box width="200px">
                        <ReduxSelect
                            name="role"
                            label="Role"
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            placeholder={<SelectPlaceholder />}
                            optionsLoadFn={
                                employeesApi.useListEmployeeRoleSelectQuery
                            }
                            onChange={(newValue) =>
                                handleChangeFilter(newValue, "role", "roles")
                            }
                            isClearable
                            emptyOption
                        />
                    </Box>
                )}

                {profile.admin && (
                    <Box width="200px">
                        <ReduxSelect
                            name="pool"
                            label="Pool"
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            placeholder={<SelectPlaceholder />}
                            optionsLoadFn={
                                catalogsApi.useListEmployeePoolSelectQuery
                            }
                            onChange={(newValue) =>
                                handleChangeFilter(newValue, "pool", "pool_id")
                            }
                            isClearable
                            emptyOption
                        />
                    </Box>
                )}

                {["super_hr", "hr", "super_admin"].some((role) =>
                    profile.roles?.includes(role),
                ) && (
                    <Box width="200px">
                        <ReduxSelect
                            name="holiday_set"
                            label="Holiday set"
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            placeholder={<SelectPlaceholder />}
                            optionsLoadFn={
                                catalogsApi.useListHolidaySetSelectQuery
                            }
                            onChange={(newValue) =>
                                handleChangeFilter(
                                    newValue,
                                    "holiday_set",
                                    "holiday_set_id",
                                )
                            }
                            isClearable
                            emptyOption
                        />
                    </Box>
                )}

                <FormControl>
                    <InputLabel id="person-state-select">
                        Person state
                    </InputLabel>
                    <Select
                        sx={{ width: "120px" }}
                        value={employeeStateFilter}
                        onChange={handleChangeEmployeeState}
                        labelId="person-state-select"
                        label="Person state"
                        size="small"
                    >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="disabled">Disabled</MenuItem>
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

export { EmployeeListFilter };
