import InfoIcon from "@mui/icons-material/Info";
import { LoadingButton } from "@mui/lab";
import { Box, Button, IconButton, Modal, Typography } from "@mui/material";
import { EditButton, FormTextField } from "_components";
import { FormRow } from "_components/fields";
import { FormDatePickerField } from "_components/fields/datepicker";
import { employeesApi } from "_redux";
import { FC, useState } from "react";
import { FieldErrorsImpl, useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import { UpdateEmployeeT } from "types";
import { checkFieldCanBeEdited, genRules, toastError } from "utils";
import { formatDateHumanReadable, formatDateYYYYMMDD } from "utils/convert";

const modalWrapperStyles = {
    width: "800px",
    maxHeight: "600px",
    background: "#FFF",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    borderRadius: 1,
    gap: 1,
    p: 2,
};

interface IProbationPeriodFieldProps {
    probation_period_started: string | null;
    probation_period_ended: string | null;
    probation_period_justification: string | null;
    metadata: any;
}

const ProbationPeriodField: FC<IProbationPeriodFieldProps> = ({
    probation_period_started,
    probation_period_ended,
    probation_period_justification,
    metadata,
}) => {
    const [editOpen, setEditOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useFormContext<UpdateEmployeeT>();

    const [updateEmployee, updateEmployeeProps] =
        employeesApi.useUpdateEmployeeMutation();

    const handleOnSubmit = (formData: UpdateEmployeeT) => {
        updateEmployee({
            id: formData.id,
            probation_period_started: formData.probation_period_started
                ? formatDateYYYYMMDD(formData.probation_period_started)
                : null,
            probation_period_ended: formData.probation_period_ended
                ? formatDateYYYYMMDD(formData.probation_period_ended)
                : null,
            probation_period_justification:
                formData.probation_period_justification,
        })
            .unwrap()
            .then(() => {
                setEditOpen(false);
                toast.success("Probation period info updated");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const save = () => {
        handleSubmit(handleOnSubmit)();
    };

    return (
        <FormRow label="Probation period ended">
            <Modal open={editOpen} onClose={() => setEditOpen(false)}>
                <Box sx={modalWrapperStyles}>
                    <Typography variant="h6">
                        Edit probation period info
                    </Typography>

                    <Box display="flex" gap={1}>
                        <FormDatePickerField
                            label="Probation period started"
                            name="probation_period_started"
                            control={control}
                        />

                        <FormDatePickerField
                            label="Probation period ended"
                            name="probation_period_ended"
                            control={control}
                        />
                    </Box>

                    <FormTextField
                        label="Justification for passing the probation period"
                        name="probation_period_justification"
                        register={register}
                        rules={genRules({ required: true, minLength: 100 })}
                        errors={errors as FieldErrorsImpl<UpdateEmployeeT>}
                        multiline
                        minRows={8}
                        maxRows={12}
                    />

                    <Box display="flex" gap={1}>
                        <LoadingButton
                            variant="outlined"
                            onClick={save}
                            size="small"
                            loading={updateEmployeeProps.isLoading}
                        >
                            Save
                        </LoadingButton>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={() => setEditOpen(false)}
                            size="small"
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <Modal open={viewOpen} onClose={() => setViewOpen(false)}>
                <Box sx={modalWrapperStyles}>
                    <Typography>
                        Probation period started:{" "}
                        <Typography component="span" fontWeight={500}>
                            {probation_period_started
                                ? formatDateHumanReadable(
                                      probation_period_started,
                                  )
                                : "n/a"}
                        </Typography>
                    </Typography>

                    <Typography>
                        Probation period ended:{" "}
                        <Typography component="span" fontWeight={500}>
                            {probation_period_ended
                                ? formatDateHumanReadable(
                                      probation_period_ended,
                                  )
                                : "n/a"}
                        </Typography>
                    </Typography>

                    <Typography fontWeight={500}>
                        Probation period justification:
                    </Typography>

                    <Box flex={1} overflow="auto" whiteSpace="pre-line">
                        {probation_period_justification || "n/a"}
                    </Box>

                    <Button
                        sx={{ alignSelf: "flex-start" }}
                        onClick={() => setViewOpen(false)}
                        variant="outlined"
                        color="error"
                        size="small"
                    >
                        Close
                    </Button>
                </Box>
            </Modal>

            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
            >
                <Box display="flex" alignItems="center" gap="4px">
                    <Typography>
                        {probation_period_ended
                            ? formatDateHumanReadable(probation_period_ended)
                            : "n/a"}
                    </Typography>

                    <IconButton
                        sx={{ padding: 0 }}
                        onClick={() => setViewOpen(true)}
                        disableRipple
                    >
                        <InfoIcon color="info" />
                    </IconButton>
                </Box>

                {checkFieldCanBeEdited(
                    "probation_period_started",
                    metadata,
                ) && (
                    <EditButton
                        tooltip="Edit"
                        onClick={() => setEditOpen(true)}
                    />
                )}
            </Box>
        </FormRow>
    );
};

export default ProbationPeriodField;
