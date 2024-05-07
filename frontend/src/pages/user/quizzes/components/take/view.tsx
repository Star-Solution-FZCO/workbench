import { LoadingButton } from "@mui/lab";
import { Box, Button, Typography } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { Modal, ParsedHTMLContent } from "_components";
import { policiesApi } from "_redux";
import { FC, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AnswerT, TakeQuizT } from "types";
import { toastError } from "utils";
import { Option } from "./option";

interface ISubmitModalProps {
    open: boolean;
    onSubmit: () => void;
    onClose: () => void;
}

const SubmitModal: FC<ISubmitModalProps> = ({ open, onSubmit, onClose }) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={1}
            >
                <Typography fontWeight={500} fontSize={18}>
                    Are you sure you want to finish the quiz?
                </Typography>

                <Box display="flex" gap={1}>
                    <Button onClick={onSubmit} variant="outlined">
                        Yes
                    </Button>
                    <Button onClick={onClose} variant="outlined" color="error">
                        No
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

interface IQuizViewProps {
    quiz: TakeQuizT;
    onFinish: (resultId: number) => void;
}

const QuizView: FC<IQuizViewProps> = ({ quiz, onFinish }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswerT[]>(
        quiz.questions.map((q) => ({ question_id: q.id, option_id: null })),
    );

    const [submitQuiz, { isLoading }] = policiesApi.useSubmitQuizMutation();

    const handleChangeAnswers = (option_id: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex].option_id = option_id;
        setAnswers(newAnswers);
    };

    const handleClickPrevious = useCallback(() => {
        if (currentQuestionIndex === 0) return;
        setCurrentQuestionIndex(currentQuestionIndex - 1);
    }, [currentQuestionIndex]);

    const handleClickNext = useCallback(() => {
        if (currentQuestionIndex === quiz.questions.length - 1) return;
        setCurrentQuestionIndex(currentQuestionIndex + 1);
    }, [currentQuestionIndex, quiz.questions.length]);

    const handleSubmitQuiz = () => {
        setModalOpen(false);
        submitQuiz({ id: quiz.id, answers, result_id: quiz.result_id })
            .unwrap()
            .then((res) => {
                onFinish(res.payload.id);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleFinish = useCallback(() => {
        const unansweredQuestionsExists = answers.some(
            (a) => a.option_id === null,
        );
        if (unansweredQuestionsExists) {
            toast.error("You haven't answered all the questions!");
            return;
        }
        setModalOpen(true);
    }, [answers]);

    const options = quiz.questions[currentQuestionIndex].options;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") handleClickPrevious();
            if (e.key === "ArrowRight") handleClickNext();
            if (e.key === "Enter") handleFinish();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleClickPrevious, handleClickNext, handleFinish]);

    return (
        <Box
            display="flex"
            flexDirection="column"
            border="1px solid #ccc"
            boxShadow={1}
            borderRadius={1}
            gap={2}
            p={4}
            height="100%"
        >
            <SubmitModal
                open={modalOpen}
                onSubmit={handleSubmitQuiz}
                onClose={() => setModalOpen(false)}
            />

            <Box
                alignSelf="flex-start"
                bgcolor="#fbfbfb"
                border="1px solid #ccc"
                borderRadius={1}
                px={2}
                py={1}
            >
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </Box>

            <Box
                flex={1}
                display="flex"
                flexDirection="column"
                gap={2}
                minHeight={0}
            >
                <Typography fontWeight={500}>
                    {quiz.questions[currentQuestionIndex].title}
                </Typography>

                {quiz.questions[currentQuestionIndex].content && (
                    <Box
                        flex={1}
                        overflow="auto"
                        border="1px solid #ccc"
                        borderRadius={1}
                        p={1}
                    >
                        <ParsedHTMLContent
                            text={quiz.questions[currentQuestionIndex].content}
                        />
                    </Box>
                )}

                <Box
                    flex={1}
                    display="flex"
                    flexDirection="column"
                    gap={2}
                    overflow="scroll"
                    border="1px solid #ccc"
                    borderRadius={1}
                    p={1}
                >
                    {options.map((option) => (
                        <Option
                            key={nanoid()}
                            option={option}
                            checked={
                                option.id ===
                                answers[currentQuestionIndex].option_id
                            }
                            onClick={() => handleChangeAnswers(option.id)}
                        />
                    ))}
                </Box>
            </Box>

            <Box display="flex">
                {currentQuestionIndex !== 0 && (
                    <Button
                        onClick={handleClickPrevious}
                        variant="outlined"
                        color="info"
                        disabled={isLoading}
                    >
                        Previous
                    </Button>
                )}

                <Box flex={1} />

                {currentQuestionIndex !== quiz.questions.length - 1 ? (
                    <Button
                        onClick={handleClickNext}
                        variant="outlined"
                        color="success"
                    >
                        Next
                    </Button>
                ) : (
                    <LoadingButton
                        onClick={handleFinish}
                        variant="outlined"
                        loading={isLoading}
                    >
                        Finish
                    </LoadingButton>
                )}
            </Box>
        </Box>
    );
};

export { QuizView };
