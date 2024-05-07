import InfoIcon from "@mui/icons-material/Info";
import { LoadingButton } from "@mui/lab";
import { Box, Button, IconButton, Modal, Typography } from "@mui/material";
import { EditButton, FormReduxSelectField, FormTextField } from "_components";
import { FormRow } from "_components/fields";
import { catalogsApi, employeesApi } from "_redux";
import { format, parseISO } from "date-fns";
import { FC, useState } from "react";
import { FieldErrorsImpl, useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import { GradeWithReasonT, UpdateEmployeeT } from "types";
import { checkFieldCanBeEdited, genRules, toastError } from "utils";

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

interface IGradeFieldProps {
    value: GradeWithReasonT | undefined;
    metadata: any;
}

const GradeField: FC<IGradeFieldProps> = ({ value, metadata }) => {
    const [editGradeOpen, setEditGradeOpen] = useState(false);
    const [viewReasonOpen, setViewReasonOpen] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useFormContext<UpdateEmployeeT>();

    const [updateEmployee, updateEmployeeProps] =
        employeesApi.useUpdateEmployeeMutation();

    const handleOnSubmit = (formData: UpdateEmployeeT) => {
        updateEmployee({
            id: formData.id,
            grade: formData.grade,
        })
            .unwrap()
            .then(() => {
                setEditGradeOpen(false);
                toast.success('"Grade" field updated');
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const save = () => {
        handleSubmit(handleOnSubmit)();
    };

    return (
        <FormRow label="Grade">
            <Modal open={editGradeOpen} onClose={() => setEditGradeOpen(false)}>
                <Box sx={modalWrapperStyles}>
                    <Typography variant="h6">Edit grade</Typography>

                    <FormReduxSelectField
                        name="grade.grade"
                        label="Grade"
                        optionsLoadFn={catalogsApi.useListGradeSelectQuery}
                        isClearable
                    />

                    <FormTextField
                        label="Reason"
                        name="grade.reason"
                        register={register}
                        rules={genRules({ required: true, minLength: 100 })}
                        errors={errors as FieldErrorsImpl<UpdateEmployeeT>}
                        multiline
                        minRows={8}
                        maxRows={12}
                    />

                    <Typography>
                        Updated:{" "}
                        {value?.updated
                            ? format(parseISO(value.updated), "dd MMM Y HH:mm")
                            : "---"}
                    </Typography>

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
                            onClick={() => setEditGradeOpen(false)}
                            size="small"
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <Modal
                open={viewReasonOpen}
                onClose={() => setViewReasonOpen(false)}
            >
                <Box sx={modalWrapperStyles}>
                    <Typography fontWeight={500}>
                        Grade: {value?.grade || "n/a"}
                    </Typography>

                    <Typography fontWeight={500}>Reason:</Typography>

                    <Box flex={1} overflow="auto" whiteSpace="pre-line">
                        {value?.reason || "---"}
                    </Box>

                    <Typography fontSize={14}>
                        Updated:{" "}
                        {value?.updated
                            ? format(parseISO(value.updated), "dd MMM Y HH:mm")
                            : "---"}
                    </Typography>

                    <Button
                        sx={{ alignSelf: "flex-start" }}
                        onClick={() => setViewReasonOpen(false)}
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
                    <Typography>{value?.grade || "n/a"}</Typography>

                    <IconButton
                        sx={{ padding: 0 }}
                        onClick={() => setViewReasonOpen(true)}
                        disableRipple
                    >
                        <InfoIcon color="info" />
                    </IconButton>
                </Box>

                {checkFieldCanBeEdited("grade", metadata) && (
                    <EditButton
                        tooltip="Edit"
                        onClick={() => setEditGradeOpen(true)}
                    />
                )}
            </Box>
        </FormRow>
    );
};

export default GradeField;
