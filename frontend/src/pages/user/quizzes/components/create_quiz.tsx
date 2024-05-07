import { yupResolver } from "@hookform/resolvers/yup";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    FormControlLabel,
    IconButton,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import { Modal } from "_components";
import { policiesApi } from "_redux";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toastError } from "utils";
import * as yup from "yup";

const quizValidationSchema = yup
    .object({
        name: yup.string().required("Required field"),
        pass_percent: yup.number().required("Required field").min(0).max(100),
        is_active: yup.boolean().required("Required field"),
    })
    .required();

type FormData = yup.InferType<typeof quizValidationSchema>;

const CreateQuiz = () => {
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);

    const [createQuiz, { isLoading }] = policiesApi.useCreateQuizMutation();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: { pass_percent: 100, is_active: true },
        resolver: yupResolver(quizValidationSchema),
    });

    const onSubmit = (formData: FormData) => {
        createQuiz(formData)
            .unwrap()
            .then((res) => {
                navigate(`${res.payload.id}/view`);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                variant="outlined"
                color="success"
                size="small"
                startIcon={<AddIcon />}
            >
                Create Quiz
            </Button>

            <Modal open={open} onClose={() => setOpen(false)}>
                <Box display="flex" flexDirection="column" gap={1}>
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        gap={1}
                    >
                        <Typography fontWeight={500}>Create quiz</Typography>

                        <IconButton
                            sx={{ p: 0 }}
                            onClick={() => setOpen(false)}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box
                        component="form"
                        display="flex"
                        flexDirection="column"
                        gap={1}
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <TextField
                            {...register("name")}
                            label="Quiz name"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                        />

                        <TextField
                            {...register("pass_percent")}
                            label="Success pass percent"
                            type="number"
                            error={!!errors.pass_percent}
                            helperText={errors.pass_percent?.message}
                        />

                        <FormControlLabel
                            label="Active"
                            control={<Switch />}
                            checked={watch("is_active")}
                            onChange={(_, checked) =>
                                setValue("is_active", checked)
                            }
                        />

                        <LoadingButton
                            type="submit"
                            variant="outlined"
                            loading={isLoading}
                        >
                            Create
                        </LoadingButton>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export { CreateQuiz };
