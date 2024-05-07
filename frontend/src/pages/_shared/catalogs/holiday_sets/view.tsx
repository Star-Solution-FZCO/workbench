import AddIcon from "@mui/icons-material/Add";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EditIcon from "@mui/icons-material/Edit";
import ListIcon from "@mui/icons-material/List";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    FormControl,
    FormHelperText,
    IconButton,
    LinearProgress,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    DataGridPro,
    GridColDef,
    GridRenderCellParams,
    gridDateComparator,
} from "@mui/x-data-grid-pro";
import { DatePicker } from "@mui/x-date-pickers";
import { CalendarMonthTable, DeleteButton, Modal } from "_components";
import { makeMonthRange } from "_components/calendar/utils";
import { FormSwitchField } from "_components/fields/switch";
import { catalogsApi, useAppSelector } from "_redux";
import { format } from "date-fns";
import { FC, useCallback, useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { HolidayT } from "types";
import { convertHolidaysToDayStatusMap, toastError } from "utils";
import { formatDateYYYYMMDD } from "utils/convert";
import { EditHolidaySetFormWrapper } from "./form";

interface IAddHolidayDialogProps {
    holiday_set_id: number;
    onSuccess: () => void;
}

const AddHolidayDialog: FC<IAddHolidayDialogProps> = ({
    holiday_set_id,
    onSuccess,
}) => {
    const [createHoliday, createHolidayProps] =
        catalogsApi.useCreateHolidayMutation();

    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<{ name: string; day: Date | null; is_working: boolean }>({
        defaultValues: {
            name: "",
            day: null,
        },
    });

    const handleChangeDay = (value: Date | null) => {
        setValue("day", value);
    };

    const onSubmit: SubmitHandler<{
        name: string;
        day: Date | null;
        is_working: boolean;
    }> = (formData) => {
        const data = {
            ...formData,
            day: formData.day ? formatDateYYYYMMDD(formData.day) : "",
        };

        createHoliday({ id: holiday_set_id, holiday: data })
            .unwrap()
            .then(() => {
                onSuccess();
                toast.success("Holiday has been successfully created");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Box display="flex" flexDirection="column" gap={2}>
                <Typography fontWeight={500}>Add holiday</Typography>

                <TextField
                    {...register("name", {
                        required: "Required field",
                    })}
                    label="Holiday name"
                    variant="outlined"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                />

                <FormControl>
                    <Controller
                        name="day"
                        control={control}
                        render={({ field: { value } }) => (
                            <DatePicker
                                value={value}
                                label="Date"
                                onChange={handleChangeDay}
                            />
                        )}
                        rules={{
                            required: "Required field",
                        }}
                    />

                    {errors.day && (
                        <FormHelperText error={!!errors.day}>
                            {errors.day.message}
                        </FormHelperText>
                    )}
                </FormControl>

                <FormSwitchField
                    control={control}
                    name="is_working"
                    label="Working day"
                />

                <LoadingButton
                    type="submit"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start" }}
                    loading={createHolidayProps.isLoading}
                >
                    Save
                </LoadingButton>
            </Box>
        </form>
    );
};

const HolidaySetView = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const profile = useAppSelector(({ profile }) => profile.payload);

    const { data, error, isLoading } = catalogsApi.useGetHolidaySetQuery({
        id: parseInt(id as string),
    });

    const [displayMode, setDisplayMode] = useState<"grid" | "calendar">(
        "calendar",
    );

    const [openAddHoliday, setOpenAddHoliday] = useState(false);
    const [openEditHolidaySet, setOpenEditHolidaySet] = useState(false);

    const [year, setYear] = useState<Date>(new Date());
    const [months, setMonths] = useState<number[]>(makeMonthRange(12));

    const [deleteHoliday] = catalogsApi.useDeleteHolidayMutation();

    const handleClickDeleteHoliday = useCallback(
        (params: GridRenderCellParams<HolidayT>) => {
            const confirmed = confirm(
                `Are you sure you want to delete "${params.row.name}" (${format(
                    new Date(params.row.day),
                    "dd MMM yyyy",
                )}) ${params.row.is_working ? "working day" : "holiday"}?`,
            );
            if (!confirmed) return;
            deleteHoliday({
                id: parseInt(id as string),
                day: params.row.day,
            });
        },
        [deleteHoliday, id],
    );

    const columns: GridColDef<HolidayT>[] = useMemo(() => {
        const _columns: GridColDef<HolidayT>[] = [
            {
                field: "name",
                headerName: "Name",
                flex: 1,
                sortable: true,
            },
            {
                field: "day",
                headerName: "Day",
                flex: 1,
                sortable: true,
                sortComparator: gridDateComparator,
                renderCell: (params) =>
                    format(new Date(params.row.day), "dd MMM yyyy"),
            },
            {
                field: "is_working",
                headerName: "Type",
                flex: 1,
                sortable: false,
                renderCell: (params) =>
                    params.row.is_working ? "working day" : "holiday",
            },
        ];

        if (profile.admin || profile.hr) {
            _columns.unshift({
                field: "",
                headerName: "",
                sortable: false,
                resizable: false,
                filterable: false,
                disableColumnMenu: true,
                disableReorder: true,
                width: 50,
                renderCell: (params) => (
                    <DeleteButton
                        onClick={() => handleClickDeleteHoliday(params)}
                    />
                ),
            });
        }

        return _columns;
    }, [handleClickDeleteHoliday, profile]);

    const handleClickBack = () => {
        if (!year) return;

        const newMonths = months.map((m) => {
            const res = m - 12;
            return res >= 0 ? res : res + 12;
        });

        if (newMonths.includes(0) && newMonths.includes(11)) {
            year.setFullYear(year.getFullYear() - 1);
            setYear(year);
        }

        setMonths(newMonths);
    };

    const handleClickForward = () => {
        if (!year) return;

        const newMonths = months.map((m) => (m + 12) % 12);

        if (newMonths.includes(11) && newMonths.includes(0)) {
            year.setFullYear(year.getFullYear() + 1);
            setYear(year);
        }

        setMonths(newMonths);
    };

    if (error && "status" in error && error.status === 404) {
        toast.error(`Holiday set with id ${id} not found`);
        navigate("..");
    }

    if (!data) return <LinearProgress />;

    return (
        <>
            <Modal
                open={openAddHoliday}
                onClose={() => setOpenAddHoliday(false)}
            >
                <AddHolidayDialog
                    holiday_set_id={data.payload.id}
                    onSuccess={() => setOpenAddHoliday(false)}
                />
            </Modal>

            <Modal
                open={openEditHolidaySet}
                onClose={() => setOpenEditHolidaySet(false)}
            >
                <EditHolidaySetFormWrapper
                    id={data.payload.id}
                    onClose={() => setOpenEditHolidaySet(false)}
                />
            </Modal>

            <Box display="flex" flexDirection="column" height="100%" gap={1}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography fontSize={20}>
                        <strong>Holiday Set:</strong> {data.payload.name}
                    </Typography>

                    <Box display="flex" gap={1}>
                        <Tooltip
                            title={displayMode === "grid" ? "Calendar" : "Grid"}
                        >
                            <IconButton
                                onClick={() =>
                                    setDisplayMode(
                                        displayMode === "grid"
                                            ? "calendar"
                                            : "grid",
                                    )
                                }
                            >
                                {displayMode === "calendar" && <ListIcon />}
                                {displayMode === "grid" && (
                                    <CalendarMonthIcon />
                                )}
                            </IconButton>
                        </Tooltip>

                        {(profile.admin || profile.hr) && (
                            <>
                                <Button
                                    onClick={() => setOpenAddHoliday(true)}
                                    startIcon={<AddIcon />}
                                    variant="outlined"
                                    size="small"
                                >
                                    Add holiday
                                </Button>

                                <Button
                                    onClick={() => setOpenEditHolidaySet(true)}
                                    startIcon={<EditIcon />}
                                    color="secondary"
                                    variant="outlined"
                                    size="small"
                                >
                                    Edit holiday set
                                </Button>
                            </>
                        )}
                    </Box>
                </Box>

                {data.payload.description && (
                    <Box maxHeight={200} fontSize={18} overflow="auto">
                        <strong>Description:</strong> {data.payload.description}
                    </Box>
                )}

                {displayMode === "grid" && (
                    <DataGridPro
                        columns={columns}
                        rows={data.payload.holidays}
                        getRowId={(row) => row.day}
                        initialState={{
                            sorting: {
                                sortModel: [{ field: "day", sort: "asc" }],
                            },
                        }}
                        density="compact"
                        pagination
                    />
                )}

                {displayMode === "calendar" && (
                    <Box display="flex" gap={1}>
                        <Button
                            sx={{ p: 0, width: "40px", minWidth: 0 }}
                            onClick={handleClickBack}
                            color="info"
                            variant="outlined"
                        >
                            <ArrowBackIosNewIcon />
                        </Button>

                        <CalendarMonthTable
                            year={year}
                            months={months}
                            dayStatusMap={convertHolidaysToDayStatusMap(
                                data.payload.holidays,
                            )}
                            loading={isLoading}
                            alterWorkingDayColor
                        />

                        <Button
                            sx={{ p: 0, width: "40px", minWidth: 0 }}
                            onClick={handleClickForward}
                            color="info"
                            variant="outlined"
                            size="small"
                        >
                            <ArrowForwardIosIcon />
                        </Button>
                    </Box>
                )}
            </Box>
        </>
    );
};

export default HolidaySetView;
