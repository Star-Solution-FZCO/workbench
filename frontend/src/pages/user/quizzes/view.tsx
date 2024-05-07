import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import ListIcon from "@mui/icons-material/List";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import { LoadingButton } from "@mui/lab";
import { Box, Button, LinearProgress, Typography } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { Title } from "_components";
import { policiesApi, useAppSelector } from "_redux";
import { formatInTimeZone } from "date-fns-tz";
import NotFound from "pages/404";
import { FC } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { QuestionT } from "types";
import { toastError } from "utils";

interface IQuestionCardProps {
    index: number;
    question: QuestionT;
}

const QuestionCard: FC<IQuestionCardProps> = ({ index, question }) => {
    return (
        <Box p={2} border="1px solid #ccc" borderRadius={1}>
            <Typography fontWeight={500}>
                {index + 1}. {question.title || "Question"}
            </Typography>
        </Box>
    );
};

const QuizView = () => {
    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "GMT";
    const isAdmin = useAppSelector((state) => state.profile.payload.admin);

    const navigate = useNavigate();
    const { quiz_id } = useParams();

    const { data: quiz, isLoading } = policiesApi.useGetQuizQuery(
        Number(quiz_id),
    );
    const [deleteQuiz, { isLoading: isDeleting }] =
        policiesApi.useDeleteQuizMutation();

    const handleDelete = () => {
        const confirmed = confirm("Are you sure you want to delete the quiz?");

        if (!confirmed) return;

        deleteQuiz(Number(quiz_id))
            .unwrap()
            .then(() => {
                toast.success("Quiz was successfully deleted");
                navigate("/quizzes");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const navigateToEdit = () => {
        if (!quiz) return;
        navigate(`/quizzes/${quiz_id}/edit`);
    };

    const copyLinkToClipboard = async () => {
        if (!quiz) return;
        await navigator.clipboard.writeText(
            window.location.origin + `/quizzes/${quiz.id}/take`,
        );
        toast.success("Link to the quiz has been copied to the clipboard");
    };

    if (!isAdmin) return <NotFound />;

    if (isLoading) return <LinearProgress />;

    if (!quiz) {
        toast.error("Quiz not found");
        return <Navigate to="/quizzes" />;
    }

    return (
        <Box display="flex" gap={1} height="100%">
            <Title title={quiz.name} />

            <Box
                flex={2}
                display="flex"
                flexDirection="column"
                gap={1}
                boxShadow={4}
                p={1}
            >
                <Button
                    sx={{ alignSelf: "flex-start" }}
                    onClick={() => navigate("/quizzes")}
                    variant="outlined"
                    color="info"
                    size="small"
                    startIcon={<ListIcon />}
                >
                    Quizzes
                </Button>

                <Typography variant="h5">{quiz.name}</Typography>

                <Typography>Pass percent: {quiz.pass_percent}%</Typography>

                <Typography>
                    Created:{" "}
                    {formatInTimeZone(
                        quiz.created + "+00:00",
                        timezone,
                        "dd MMM yyyy HH:mm (OOOO)",
                    )}
                </Typography>
                <Typography>
                    Updated:{" "}
                    {formatInTimeZone(
                        quiz.updated + "+00:00",
                        timezone,
                        "dd MMM yyyy HH:mm (OOOO)",
                    )}
                </Typography>

                <Box display="flex" gap={1} flexWrap="wrap">
                    <Button
                        onClick={navigateToEdit}
                        variant="outlined"
                        color="success"
                        size="small"
                        startIcon={<EditIcon />}
                        disabled={isDeleting}
                    >
                        Edit
                    </Button>

                    <LoadingButton
                        onClick={handleDelete}
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        loading={isDeleting}
                    >
                        Delete
                    </LoadingButton>

                    {quiz.questions.length > 0 && (
                        <>
                            <Button
                                onClick={() =>
                                    navigate(`/quizzes/${quiz.id}/take`)
                                }
                                variant="outlined"
                                size="small"
                                startIcon={<PlayCircleOutlineIcon />}
                            >
                                Take quiz
                            </Button>

                            <Button
                                onClick={copyLinkToClipboard}
                                variant="outlined"
                                color="info"
                                size="small"
                                startIcon={<LinkIcon />}
                            >
                                Quiz link
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            <Box
                flex={5}
                display="flex"
                flexDirection="column"
                gap={1}
                boxShadow={4}
                p={1}
            >
                <Box pb={1} borderBottom="1px solid #ccc">
                    <Typography variant="h6">
                        Questions ({quiz.questions.length})
                    </Typography>
                </Box>

                {quiz.questions.length === 0 && (
                    <Box
                        flex={1}
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                        gap={2}
                    >
                        <Typography variant="h6">No questions</Typography>
                        <Button
                            onClick={() => navigate(`/quizzes/${quiz_id}/edit`)}
                            size="large"
                            variant="outlined"
                            color="success"
                        >
                            Create question
                        </Button>
                    </Box>
                )}

                <Box
                    display="flex"
                    flexDirection="column"
                    gap={1}
                    overflow="auto"
                >
                    {quiz.questions.map((question, index) => (
                        <QuestionCard
                            key={nanoid()}
                            index={index}
                            question={question}
                        />
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default QuizView;
