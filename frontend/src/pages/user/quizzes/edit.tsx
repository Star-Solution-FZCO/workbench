import { yupResolver } from "@hookform/resolvers/yup";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import SaveIcon from "@mui/icons-material/Save";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    CircularProgress,
    FormControlLabel,
    IconButton,
    LinearProgress,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import { Title } from "_components";
import {
    policiesApi,
    setQuizStatus,
    useAppDispatch,
    useAppSelector,
} from "_redux";
import NotFound from "pages/404";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { toastError } from "utils";
import * as yup from "yup";
import { QuestionEdit, QuestionList } from "./components";

const quizValidationSchema = yup
    .object({
        name: yup.string().required("Required field"),
        pass_percent: yup.number().required("Required field").min(0).max(100),
        pool_question_count: yup.number().required("Required field").min(0),
        hard_confirm: yup.boolean().required("Required field"),
        is_active: yup.boolean().required("Required field"),
    })
    .required();

type FormData = yup.InferType<typeof quizValidationSchema>;

const QuizState = () => {
    const quizStatus = useAppSelector((state) => state.shared.quizStatus);

    return (
        <Box display="flex" alignItems="center" gap={0.5}>
            {quizStatus.fetching ? (
                <CircularProgress size={20} color="inherit" />
            ) : quizStatus.success ? (
                <CheckIcon color="success" />
            ) : (
                <ErrorOutlinedIcon color="error" />
            )}
            <Typography fontSize={14}>
                {quizStatus.fetching
                    ? "Saving..."
                    : quizStatus.success
                      ? "Saved"
                      : "Error when saving"}
            </Typography>
        </Box>
    );
};

const QuizEdit = () => {
    const isAdmin = useAppSelector((state) => state.profile.payload.admin);

    const navigate = useNavigate();
    const { quiz_id, question_id } = useParams();

    const dispatch = useAppDispatch();

    const { data: quiz, isLoading } = policiesApi.useGetQuizQuery(
        Number(quiz_id),
    );
    const [updateQuiz, { isLoading: quizUpdating }] =
        policiesApi.useUpdateQuizMutation();

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: { name: "", pass_percent: 100, pool_question_count: 0 },
        resolver: yupResolver(quizValidationSchema),
    });

    const onSubmit = (formData: FormData) => {
        if (!quiz) return;

        dispatch(setQuizStatus({ fetching: true }));
        updateQuiz({
            id: Number(quiz_id),
            name: formData.name,
            pass_percent: formData.pass_percent,
            pool_question_count: formData.pool_question_count,
            hard_confirm: formData.hard_confirm,
            is_active: formData.is_active,
        })
            .unwrap()
            .then(() => {
                dispatch(setQuizStatus({ success: true }));
            })
            .catch((error) => {
                toastError(error);
                dispatch(setQuizStatus({ success: false }));
            })
            .finally(() => {
                dispatch(setQuizStatus({ fetching: false }));
            });
    };

    useEffect(() => {
        if (quiz) {
            reset({
                name: quiz.name,
                pass_percent: quiz.pass_percent,
                pool_question_count: quiz.pool_question_count,
                hard_confirm: quiz.hard_confirm,
                is_active: quiz.is_active,
            });
        }
    }, [quiz]);

    if (!isAdmin) return <NotFound />;

    if (isLoading) return <LinearProgress />;

    if (!quiz) {
        toast.error("Quiz not found");
        return <Navigate to="/quizzes" />;
    }

    return (
        <Box display="flex" flexDirection="column" height="100%">
            <Title title={quiz.name} />

            <Box
                component="form"
                display="flex"
                borderBottom="1px solid #ccc"
                onSubmit={handleSubmit(onSubmit)}
                gap={1}
                pb={1}
            >
                <IconButton
                    onClick={() => navigate(`/quizzes/${quiz_id}/view`)}
                >
                    <ArrowBackIcon />
                </IconButton>

                <TextField
                    sx={{ width: "300px" }}
                    {...register("name")}
                    label="Name"
                    size="small"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    sx={{ width: "100px" }}
                    {...register("pass_percent")}
                    label="Pass percent"
                    size="small"
                    type="number"
                    error={!!errors.pass_percent}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    sx={{ width: "240px" }}
                    {...register("pool_question_count")}
                    label="Number of questions when taking quiz"
                    size="small"
                    type="number"
                    error={!!errors.pool_question_count}
                    InputLabelProps={{ shrink: true }}
                />

                <Controller
                    name="hard_confirm"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <FormControlLabel
                            label="Hard confirm"
                            control={
                                <Switch
                                    checked={value}
                                    onChange={(_, checked) => onChange(checked)}
                                />
                            }
                        />
                    )}
                />

                <Controller
                    name="is_active"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <FormControlLabel
                            label="Active"
                            control={
                                <Switch
                                    checked={value}
                                    onChange={(_, checked) => onChange(checked)}
                                />
                            }
                        />
                    )}
                />

                <LoadingButton
                    sx={{ alignSelf: "flex-start", height: "40px" }}
                    type="submit"
                    variant="outlined"
                    size="small"
                    loading={quizUpdating}
                    startIcon={<SaveIcon />}
                >
                    Save
                </LoadingButton>

                <QuizState />
            </Box>

            <Box display="flex" gap={1} height="calc(100% - 49px)">
                <QuestionList />

                {!question_id ? (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        py={1}
                        width="calc(100% - 300px)"
                    >
                        <Typography fontWeight={500} fontSize={20}>
                            Add or select question
                        </Typography>
                    </Box>
                ) : (
                    <QuestionEdit />
                )}
            </Box>
        </Box>
    );
};

export default QuizEdit;
