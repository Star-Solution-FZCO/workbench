import { Box, CircularProgress, Typography } from "@mui/material";
import { Prompt, Title } from "_components";
import { policiesApi } from "_redux";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { QuizView, StartQuiz } from "./components";

type QuizState = "start" | "in_progress" | "finish";

const QuizTake = () => {
    const { quiz_id } = useParams();
    const { state } = useLocation();

    const [quizState, setQuizState] = useState<QuizState>("start");
    const [resultId, setResultId] = useState<number | null>(null);

    const { data: quiz, isLoading } = policiesApi.useTakeQuizQuery(
        Number(quiz_id),
        {
            refetchOnMountOrArgChange: true,
        },
    );

    const handleFinish = (resultId: number) => {
        setResultId(resultId);
        setQuizState("finish");
    };

    useEffect(() => {
        if (quizState === "in_progress") {
            window.onbeforeunload = () => true;
        }
        if (quizState === "finish") {
            window.onbeforeunload = null;
        }

        return () => {
            window.onbeforeunload = null;
        };
    }, [quizState]);

    if (isLoading)
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
            >
                <CircularProgress size={72} thickness={6} />
            </Box>
        );

    if (!quiz)
        return (
            <Typography align="center" variant="h3" mt={2}>
                Quiz not found
            </Typography>
        );

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%" p={3}>
            <Title title={quiz.name} />

            <Prompt
                when={quizState === "in_progress"}
                message={
                    "If you leave the quiz, your answers will not be saved. Leave the page?"
                }
            />

            {quizState === "start" && (
                <StartQuiz
                    quiz={quiz}
                    onStart={() => setQuizState("in_progress")}
                />
            )}
            {quizState === "in_progress" && (
                <QuizView quiz={quiz} onFinish={handleFinish} />
            )}
            {quizState === "finish" && (
                <Navigate to={`/quizzes/results/${resultId}`} state={state} />
            )}
        </Box>
    );
};

export default QuizTake;
