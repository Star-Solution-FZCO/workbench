import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { LoadingButton } from "@mui/lab";
import { Box, Button, LinearProgress, Radio, Typography } from "@mui/material";
import { Accordion, Employee, Modal, ParsedHTMLContent } from "_components";
import { policiesApi, useAppSelector } from "_redux";
import clsx from "clsx";
import { formatInTimeZone } from "date-fns-tz";
import { FC, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AnswerT, QuizResultAnswerT, QuizResultOptionT } from "types";
import { toastError } from "utils";
import { ResultsNavigation } from "./components";
import styles from "./result.module.scss";

interface IAnswerOptionProps {
    option: QuizResultOptionT;
    answerIndex: number;
    onClick: (answerIndex: number, option_id: number) => void;
    canConfirm?: boolean;
}

const AnswerOption: FC<IAnswerOptionProps> = ({
    option,
    answerIndex,
    onClick,
    canConfirm,
}) => {
    return (
        <Box
            className={clsx(styles.option, {
                [styles.option_correct]: option.correct,
                [styles.option_incorrect]: !option.correct && option.selected,
            })}
        >
            <Radio
                className={clsx(styles.option__radio, {
                    [styles.option__radio_correct]: option.correct,
                    [styles.option__radio_incorrect]:
                        !option.correct && option.selected,
                })}
                onClick={() => onClick(answerIndex, option.id)}
                defaultChecked={option.selected}
                disabled={!option.correct || option.selected || !canConfirm}
            />
            {option.content}
        </Box>
    );
};

interface IAnswerCardProps {
    answer: QuizResultAnswerT;
    index: number;
    numberOfAnswers: number;
    onOptionClick: (answerIndex: number, option_id: number) => void;
    canConfirm?: boolean;
}

const AnswerCard: FC<IAnswerCardProps> = ({
    answer,
    index,
    numberOfAnswers,
    onOptionClick,
    canConfirm,
}) => {
    const Icon = answer.correct ? CheckCircleOutlineIcon : HighlightOffIcon;

    const color = answer.correct ? "rgb(38, 173, 96)" : "rgb(235, 87, 87)";

    return (
        <Box
            id={`answer-${answer.order}`}
            display="flex"
            flexDirection="column"
            border="1px solid #ccc"
            borderRadius={1}
            p={4}
            gap={2}
        >
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                color={color}
            >
                <Box
                    sx={{
                        px: 3,
                        py: 1.5,
                        borderWidth: "1px",
                        borderStyle: "solid",
                        borderColor: color,
                        borderRadius: 1,
                        bgcolor: answer.correct
                            ? "rgb(38, 173, 96, 0.07)"
                            : "rgb(235, 87, 87, 0.07)",
                    }}
                >
                    Question {answer.order} of {numberOfAnswers}
                </Box>

                <Box display="flex" alignItems="center" gap={0.5}>
                    <Icon />
                    <Typography>
                        {answer.correct ? "Correct" : "Incorrect"} answer
                    </Typography>
                </Box>
            </Box>

            <Box display="flex" flexDirection="column" gap={0.5}>
                <Typography fontWeight={500} fontSize={18}>
                    {answer.question.title}
                </Typography>

                {answer.question.content && (
                    <Accordion title="Content" defaultExpanded={answer.correct}>
                        <Box maxHeight="400px" overflow="auto" p={1}>
                            <ParsedHTMLContent text={answer.question.content} />
                        </Box>
                    </Accordion>
                )}

                {answer.question.solution && (
                    <Accordion
                        title="Solution"
                        defaultExpanded={!answer.correct}
                    >
                        <Box maxHeight="400px" overflow="auto" p={1}>
                            <ParsedHTMLContent
                                text={answer.question.solution}
                            />
                        </Box>
                    </Accordion>
                )}
            </Box>

            {answer.options.map((option) => (
                <AnswerOption
                    key={option.id}
                    option={option}
                    answerIndex={index}
                    onClick={onOptionClick}
                    canConfirm={canConfirm}
                />
            ))}
        </Box>
    );
};

interface IApproveModalProps {
    open: boolean;
    onClose: () => void;
    onApprove: () => void;
    isLoading: boolean;
}

const ApproveModal: FC<IApproveModalProps> = ({
    open,
    onClose,
    onApprove,
    isLoading,
}) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={1}
            >
                <Typography fontWeight={700} fontSize={18}>
                    You are passed policy quiz. Approve policy?
                </Typography>

                <Box display="flex" gap={1}>
                    <LoadingButton
                        onClick={onApprove}
                        variant="outlined"
                        loading={isLoading}
                    >
                        Approve
                    </LoadingButton>

                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="error"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

const QuizResultView = () => {
    const { id } = useParams();
    const { state } = useLocation();

    const timezone =
        useAppSelector((state) => state.profile.payload.timezone) || "GMT";

    const { data: result, isLoading } = policiesApi.useGetQuizResultQuery(
        Number(id),
    );

    const [answers, setAnswers] = useState<AnswerT[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [approved, setApproved] = useState(false);

    const [approvePolicy, { isLoading: policyApproving }] =
        policiesApi.useApprovePolicyMutation();
    const [confirmQuizResult, { isLoading: quizResultConfirming }] =
        policiesApi.useConfirmQuizResultMutation();

    const onApprove = () => {
        if (!state) return;

        const policy = state.policy;

        approvePolicy(state.policy.id)
            .unwrap()
            .then(() => {
                setApproved(true);
                setModalOpen(false);
                toast.success(`Policy "${policy.name}" approved`);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleClickOption = (answerIndex: number, option_id: number) => {
        const newAnswers = [...answers];
        newAnswers[answerIndex].option_id = option_id;
        setAnswers(newAnswers);
    };

    const onConfirm = () => {
        if (!result) return;

        const confirmed = confirm(
            "Are you sure you want to confirm the answers?",
        );
        if (!confirmed) return;

        confirmQuizResult({ id: result.id, answers })
            .unwrap()
            .then(() => {
                toast.success(`Quiz successfully confirmed`);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    useEffect(() => {
        if (state?.policy && result?.passed && result?.confirmed && !approved) {
            setModalOpen(true);
        }
    }, [state, result, approved]);

    useEffect(() => {
        if (result) {
            setAnswers(
                result.answers.map((a) => ({
                    question_id: a.question.id,
                    option_id: a.options.find((o) => o.selected)?.id || -1,
                })),
            );
        }
    }, [result]);

    if (isLoading) return <LinearProgress />;

    if (!result)
        return (
            <Typography mt={2} variant="h5">
                Quiz result not found
            </Typography>
        );

    return (
        <Box display="flex" gap={2}>
            <Box display="flex" flexDirection="column" flex={1} gap={2}>
                <ApproveModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onApprove={onApprove}
                    isLoading={policyApproving}
                />

                <Box
                    id="summary"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={1}
                    py={8}
                    border="1px solid #ccc"
                    borderRadius={1}
                    p={1}
                    textAlign="center"
                >
                    <Typography fontSize={32} fontWeight={700}>
                        Quiz: "{result.quiz.name}" is{" "}
                        <Typography
                            component="span"
                            fontSize="inherit"
                            fontWeight="inherit"
                            color={result.passed ? "#26ad60" : "#eb5757"}
                        >
                            {result.passed ? "" : "not"} passed
                        </Typography>
                    </Typography>

                    {result.passed && result.can_confirm && (
                        <Typography fontWeight={500} fontSize={20}>
                            for full confirmation you need to click on the
                            correct answers <br />
                            in the wrongly answered questions
                        </Typography>
                    )}

                    <Typography fontWeight={500}>
                        {result.answers.filter((a) => a.correct).length} out of{" "}
                        {result.number_of_answers} correct answers. Score:{" "}
                        {result.score}%. Quiz pass percent:{" "}
                        {result.quiz.pass_percent}%
                    </Typography>

                    <Typography fontWeight={500}>
                        Datetime:{" "}
                        {formatInTimeZone(
                            result.created + "+00:00",
                            timezone,
                            "dd MMMM yyyy HH:mm (OOOO)",
                        )}
                    </Typography>

                    <Employee employee={result.employee} />

                    {state?.policy &&
                        result.passed &&
                        result?.confirmed &&
                        !approved && (
                            <Button
                                onClick={() => setModalOpen(true)}
                                variant="outlined"
                                disabled={isLoading}
                            >
                                Approve policy
                            </Button>
                        )}
                </Box>

                {result.answers.map((answer, index) => (
                    <AnswerCard
                        key={answer.id}
                        answer={answer}
                        index={index}
                        numberOfAnswers={result.number_of_answers}
                        onOptionClick={handleClickOption}
                        canConfirm={result.can_confirm}
                    />
                ))}
            </Box>

            <Box
                width="210px"
                position="sticky"
                top={-8}
                alignSelf="flex-start"
            >
                <ResultsNavigation
                    result={result}
                    canConfirm={result.can_confirm}
                    onConfirm={onConfirm}
                    isLoading={quizResultConfirming}
                />
            </Box>
        </Box>
    );
};

export default QuizResultView;
