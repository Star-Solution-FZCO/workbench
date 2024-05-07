import { yupResolver } from "@hookform/resolvers/yup";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
    Box,
    Button,
    FormControlLabel,
    LinearProgress,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import { RichTextEditor, initialListState } from "_components";
import { policiesApi, setQuizStatus, useAppDispatch } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { FC, useEffect } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { QuestionT } from "types";
import { toastError } from "utils";
import * as yup from "yup";
import { AutoSave } from "./auto_save";
import { OptionList } from "./option";

interface IQuestionCardProps {
    question: QuestionT;
    index: number;
}

const QuestionCard: FC<IQuestionCardProps> = ({ question, index }) => {
    const { quiz_id, question_id } = useParams();

    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/quizzes/${quiz_id}/edit/question/${question.id}`);
    };

    const questionIdMatched = question_id === question.id.toString();

    return (
        <Box
            onClick={handleClick}
            sx={{
                cursor: "pointer",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: questionIdMatched ? "blue" : "#ccc",
                boxSizing: "border-box",
            }}
            maxWidth="100%"
            p={1}
            borderRadius={1}
            boxShadow={4}
        >
            <Typography
                sx={{
                    flex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
                title={question.title}
            >
                {index}. {question.title || "Question"}
            </Typography>
        </Box>
    );
};

const QuestionList = () => {
    const { quiz_id } = useParams();
    const navigate = useNavigate();

    const { data: questions, isLoading } = policiesApi.useListQuestionQuery(
        makeListParams(
            {
                ...initialListState,
                filter: { quiz_id: `quiz_id:${quiz_id}` },
                sort_by: [{ columnKey: "order", direction: "ASC" }],
            },
            [],
        ),
    );

    const [addQuestion] = policiesApi.useCreateQuestionMutation();

    const handleClickAddQuestion = () => {
        if (!questions) return;

        addQuestion({
            quiz_id: Number(quiz_id),
            order: questions.payload.items.length + 1,
        })
            .unwrap()
            .then((res) => {
                navigate(`/quizzes/${quiz_id}/edit/question/${res.payload.id}`);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    if (isLoading) return <LinearProgress />;
    if (!questions)
        return (
            <Box
                width="300px"
                display="flex"
                flexDirection="column"
                gap={1}
                borderRight="1px solid #ccc"
                py={1}
                pr={1}
            >
                <Typography align="center" fontWeight={500}>
                    No questions
                </Typography>
            </Box>
        );

    return (
        <Box
            width="300px"
            display="flex"
            flexDirection="column"
            gap={1}
            borderRight="1px solid #ccc"
            py={1}
            pr={1}
        >
            {questions.payload.items.length === 0 && (
                <Typography align="center" fontWeight={500}>
                    No questions
                </Typography>
            )}

            <Box display="flex" flexDirection="column" gap={1} overflow="auto">
                {questions.payload.items.map((question, index) => (
                    <QuestionCard
                        key={question.id}
                        index={index + 1}
                        question={question}
                    />
                ))}
            </Box>

            <Button
                onClick={handleClickAddQuestion}
                variant="outlined"
                startIcon={<AddIcon />}
            >
                Add question
            </Button>
        </Box>
    );
};

const questionValidationSchema = yup
    .object({
        title: yup.string(),
        content: yup.string(),
        solution: yup.string(),
        required: yup.boolean(),
    })
    .required();

type FormData = yup.InferType<typeof questionValidationSchema>;

const QuestionEdit = () => {
    const navigate = useNavigate();
    const { quiz_id, question_id } = useParams();

    const dispatch = useAppDispatch();

    const methods = useForm({
        defaultValues: { title: "", content: "" },
        resolver: yupResolver(questionValidationSchema),
    });

    const {
        control,
        register,
        reset,
        formState: { errors },
    } = methods;

    const { data: question, isLoading } = policiesApi.useGetQuestionQuery(
        Number(question_id),
    );

    const [updateQuestion] = policiesApi.useUpdateQuestionMutation();
    const [deleteQuestion] = policiesApi.useDeleteQuestionMutation();

    const handleClickDelete = () => {
        if (!question) return;

        const confirmed = confirm(
            "Are you sure you want to delete the question?",
        );
        if (!confirmed) return;

        deleteQuestion(question.id)
            .unwrap()
            .then(() => {
                navigate(`/quizzes/${quiz_id}/edit`);
                toast.success("Question was successfully deleted");
            })
            .catch((error) => toastError(error));
    };

    const onSave = (formData: FormData) => {
        if (!question) return;

        dispatch(setQuizStatus({ fetching: true }));
        updateQuestion({
            id: question.id,
            title: formData.title,
            content: formData.content,
            solution: formData.solution,
            required: formData.required,
        })
            .unwrap()
            .then(() => {
                dispatch(setQuizStatus({ success: true }));
            })
            .catch(() => {
                dispatch(setQuizStatus({ success: false }));
            })
            .finally(() => {
                dispatch(setQuizStatus({ fetching: false }));
            });
    };

    useEffect(() => {
        if (question) {
            reset({
                title: question.title,
                content: question.content,
                solution: question.solution,
                required: question.required,
            });
        }
    }, [question]);

    if (isLoading) return <LinearProgress />;
    if (!question)
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                width="100%"
                gap={0.5}
            >
                <Typography variant="h5">Question not found</Typography>
                <Typography fontSize={18}>Add or select question</Typography>
            </Box>
        );

    return (
        <FormProvider {...methods}>
            <Box
                display="flex"
                flexDirection="column"
                gap={1}
                width="calc(100% - 300px)"
                position="relative"
            >
                <Box display="flex" gap={1} mt={1}>
                    <TextField
                        {...register("title")}
                        label="Question title"
                        size="small"
                        error={!!errors.title}
                        helperText={errors.title?.message}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />

                    <Controller
                        name="required"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <FormControlLabel
                                label="Required"
                                control={
                                    <Switch
                                        checked={value}
                                        onChange={(_, checked) =>
                                            onChange(checked)
                                        }
                                    />
                                }
                            />
                        )}
                    />

                    <Button
                        sx={{
                            width: "40px",
                            height: "40px",
                            p: 0,
                            minWidth: 0,
                        }}
                        onClick={handleClickDelete}
                        color="error"
                        variant="outlined"
                    >
                        <DeleteIcon />
                    </Button>
                </Box>

                <Box height="42%" width="100%" display="flex" gap={0.5}>
                    <Box width="50%">
                        <Controller
                            control={control}
                            name="content"
                            render={({ field: { onChange, value } }) => (
                                <RichTextEditor
                                    data={value || ""}
                                    placeholder="Content"
                                    onChange={(value) => onChange(value)}
                                />
                            )}
                        />
                    </Box>
                    <Box width="50%">
                        <Controller
                            control={control}
                            name="solution"
                            render={({ field: { onChange, value } }) => (
                                <RichTextEditor
                                    data={value || ""}
                                    placeholder="Solution"
                                    onChange={(value) => onChange(value)}
                                />
                            )}
                        />
                    </Box>
                </Box>

                <OptionList options={question.options} />

                <AutoSave onSave={onSave} callbackDeps={[question]} />
            </Box>
        </FormProvider>
    );
};

export { QuestionCard, QuestionEdit, QuestionList };
