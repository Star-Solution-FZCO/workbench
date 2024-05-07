import { LoadingButton } from "@mui/lab";
import { Box, Button, Typography } from "@mui/material";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { QuizResultAnswerT, QuizResultT } from "types";

interface INavBlockProps {
    answer: QuizResultAnswerT;
}

const NavBlock: FC<INavBlockProps> = ({ answer }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`#answer-${answer.order}`);
    };

    return (
        <Box
            sx={{
                width: "32px",
                height: "32px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                bgcolor: answer.correct
                    ? "rgb(38, 173, 96)"
                    : "rgb(235, 87, 87)",
                color: "#fff",
                fontWeight: 500,
                borderRadius: 1,
            }}
            onClick={handleClick}
        >
            {answer.order}
        </Box>
    );
};

interface IResultsNavigationProps {
    result: QuizResultT;
    canConfirm: boolean;
    onConfirm: () => void;
    isLoading?: boolean;
}

const ResultsNavigation: FC<IResultsNavigationProps> = ({
    result,
    canConfirm,
    onConfirm,
    isLoading,
}) => {
    const navigate = useNavigate();

    const handleClickSummary = () => {
        navigate("#summary");
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            border="1px solid #ccc"
            borderRadius={1}
            gap={1}
            p={1}
        >
            <Typography fontWeight={500} fontSize={18}>
                Navigation
            </Typography>

            <Button
                onClick={handleClickSummary}
                variant="outlined"
                size="small"
                color="info"
            >
                Summary
            </Button>

            <Box display="flex" flexWrap="wrap" gap={1}>
                {result.answers.map((answer) => (
                    <NavBlock key={answer.order} answer={answer} />
                ))}
            </Box>

            {canConfirm && (
                <LoadingButton
                    onClick={onConfirm}
                    variant="outlined"
                    size="small"
                    color="success"
                    loading={isLoading}
                >
                    Confirm
                </LoadingButton>
            )}
        </Box>
    );
};

export { ResultsNavigation };
